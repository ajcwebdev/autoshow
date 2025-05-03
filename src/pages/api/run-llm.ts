// src/pages/api/run-llm.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { dbService } from "../../db"
import { 
  computeLLMCosts, 
  retryLLMCall, 
  callChatGPT, 
  callClaude, 
  callGemini, 
  callGroq 
} from "../../services/llm"
import { L_CONFIG, ENV_VARS_MAP } from '../../types'
import type {
  ProcessingOptions,
  ShowNoteMetadata,
  LLMResult,
  ChatGPTModelValue,
  ClaudeModelValue,
  GeminiModelValue,
  GroqModelValue
} from '../../types'

export const POST: APIRoute = async ({ request }) => {
  const logPrefix = '[api/run-llm]'
  console.log(`${logPrefix} Starting LLM processing request`)
  
  try {
    const body = await request.json()
    const llmServices = body?.llmServices
    const options: ProcessingOptions = body?.options || {}
    
    console.log(`${logPrefix} Request received with LLM service: ${llmServices}`)
    
    const loggableOptions = { ...options }
    delete loggableOptions.openaiApiKey
    delete loggableOptions.anthropicApiKey
    delete loggableOptions.geminiApiKey
    delete loggableOptions.groqApiKey
    delete loggableOptions.mnemonic
    
    console.log(`${logPrefix} Options (sanitized): ${JSON.stringify(loggableOptions)}`)
    console.log(`${logPrefix} Processing with LLM service: ${llmServices}`)
    
    const frontMatter = options?.frontMatter as string | undefined
    const prompt = options?.promptText as string | undefined
    const transcript = options?.transcript as string | undefined
    
    if (options) {
      console.log(`${logPrefix} Setting environment variables from options`)
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey, envKey]) => {
        const value = options[bodyKey]
        if (value) {
          console.log(`${logPrefix} Setting ${envKey} from options`)
          process.env[envKey] = value as string
        }
      })
    }
    
    if (!llmServices) {
      console.warn(`${logPrefix} No LLM service selected. Skipping LLM processing.`)
    }
    
    if (!frontMatter || !prompt || !transcript) {
      console.error(`${logPrefix} Missing required options: frontMatter, prompt, or transcript`)
      return new Response(JSON.stringify({ error: 'frontMatter, prompt, and transcript are required in options' }), { status: 400 })
    }
    
    console.log(`${logPrefix} Parsing front matter and extracting metadata`)
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    const frontMatterLines = frontMatter.split('\n').slice(1, -1)
    const metadata: Partial<ShowNoteMetadata> = {}
    
    frontMatterLines.forEach(line => {
      if (line) {
        const m = line.match(/^(\w+):\s*"(.*?)"$/)
        if (m && m[1]) {
          const key = m[1]
          const val = m[2] || ''
          metadata[key as keyof ShowNoteMetadata] = val
        }
      }
    })
    
    console.log(`${logPrefix} Extracted metadata: ${JSON.stringify(metadata)}`)
    
    const metaFromBody = options['metadata'] as Partial<ShowNoteMetadata> | undefined
    if (metaFromBody) {
      console.log(`${logPrefix} Merging metadata from body`)
      Object.assign(metadata, metaFromBody)
    }
    
    const finalMetadata: ShowNoteMetadata = {
      title: metadata.title || 'Untitled Show Note',
      publishDate: metadata.publishDate || new Date().toISOString().split('T')[0],
      showLink: metadata.showLink,
      channel: metadata.channel,
      channelURL: metadata.channelURL,
      description: metadata.description,
      coverImage: metadata.coverImage,
      walletAddress: options['walletAddress'] as string || metadata.walletAddress,
      mnemonic: options['mnemonic'] as string || metadata.mnemonic
    }
    
    console.log(`${logPrefix} Final metadata prepared: ${JSON.stringify({ ...finalMetadata, mnemonic: '***REDACTED***' })}`)
    
    const baseFilename = `${finalMetadata.publishDate}-${finalMetadata.title}`.replace(/[^a-z0-9\-]/gi, '_').toLowerCase()
    const finalPathBase = path.join('autoshow', 'content', baseFilename)
    console.log(`${logPrefix} Generated base filename: ${baseFilename}`)
    
    let showNotesResult = ""
    let userModel = ""
    const numericLLMCost = Number(options.llmCost) || 0
    
    if (llmServices) {
      console.log(`${logPrefix} Processing with '${llmServices}' Language Model`)
      const config = L_CONFIG[llmServices as keyof typeof L_CONFIG]
      
      if (!config) {
        console.error(`${logPrefix} Unknown LLM service: ${llmServices}`)
        throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      
      const optionValue = options[llmServices as keyof ProcessingOptions]
      const defaultModelId = config.models[0]?.modelId ?? ''
      
      userModel = typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== ''
        ? optionValue
        : defaultModelId
        
      console.log(`${logPrefix} Selected model: ${userModel} for service ${llmServices}`)
      
      if (!userModel) {
        console.error(`${logPrefix} Could not determine a valid model for service ${llmServices}`)
        throw new Error(`Could not determine a valid model for service ${llmServices}`)
      }
      
      let showNotesData: LLMResult
      
      switch (llmServices) {
        case 'chatgpt':
          console.log(`${logPrefix} Calling ChatGPT with model: ${userModel}`)
          showNotesData = await retryLLMCall(() => callChatGPT(userModel as ChatGPTModelValue, prompt, transcript))
          break
          
        case 'claude':
          console.log(`${logPrefix} Calling Claude with model: ${userModel}`)
          showNotesData = await retryLLMCall(() => callClaude(userModel as ClaudeModelValue, prompt, transcript))
          break
          
        case 'gemini':
          console.log(`${logPrefix} Calling Gemini with model: ${userModel}`)
          showNotesData = await retryLLMCall(() => callGemini(userModel as GeminiModelValue, prompt, transcript))
          break
          
        case 'groq':
          console.log(`${logPrefix} Calling Groq with model: ${userModel}`)
          showNotesData = await retryLLMCall(() => callGroq(userModel as GroqModelValue, prompt, transcript))
          break
          
        default:
          console.error(`${logPrefix} Unknown or unhandled LLM service: ${llmServices}`)
          throw new Error(`Unknown or unhandled LLM service: ${llmServices}`)
      }
      
      console.log(`${logPrefix} LLM call successful for service ${llmServices} using model ${userModel}`)
      showNotesResult = showNotesData.content
      console.log(`${logPrefix} Generated content length: ${showNotesResult.length}`)
    } else {
      showNotesResult = "LLM processing skipped."
      console.log(`${logPrefix} LLM processing skipped`)
    }
    
    const numericTranscriptionCost = Number(options.transcriptionCost) || 0
    const finalCost = numericTranscriptionCost + numericLLMCost
    
    console.log(`${logPrefix} Costs - Transcription: ${numericTranscriptionCost}, LLM: ${numericLLMCost}, Final: ${finalCost}`)
    
    const insertedNoteData = {
      showLink: finalMetadata.showLink || undefined,
      channel: finalMetadata.channel || undefined,
      channelURL: finalMetadata.channelURL || undefined,
      title: finalMetadata.title,
      description: finalMetadata.description || undefined,
      publishDate: finalMetadata.publishDate,
      coverImage: finalMetadata.coverImage || undefined,
      frontmatter: frontMatter,
      prompt: prompt,
      transcript: transcript,
      llmOutput: showNotesResult,
      walletAddress: finalMetadata.walletAddress || undefined,
      mnemonic: finalMetadata.mnemonic || undefined,
      llmService: llmServices || undefined,
      llmModel: userModel || undefined,
      llmCost: numericLLMCost,
      transcriptionService: options.transcriptionServices as string || undefined,
      transcriptionModel: options.transcriptionModel as string || undefined,
      transcriptionCost: numericTranscriptionCost,
      finalCost: finalCost
    }
    
    console.log(`${logPrefix} Saving show note to database with title: ${insertedNoteData.title}`)
    const newRecord = await dbService.insertShowNote(insertedNoteData)
    console.log(`${logPrefix} Show note saved with ID: ${newRecord.id}`)
    
    let verifiedRecord = null
    if (typeof newRecord.id === 'number') {
      console.log(`${logPrefix} Verifying record was saved correctly, fetching ID: ${newRecord.id}`)
      verifiedRecord = await dbService.getShowNote(newRecord.id)
    }
    
    if (!verifiedRecord) {
      console.error(`${logPrefix} Verification failed - Record with ID ${newRecord.id} not found in database`)
    } else {
      console.log(`${logPrefix} Record verification successful`)
    }
    
    return new Response(JSON.stringify({
      showNote: newRecord,
      showNotesResult
    }), { status: 200 })
  } catch (error) {
    console.error(`${logPrefix} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`${logPrefix} Error message: ${errorMessage}`)
    if (errorStack) console.error(`${logPrefix} Error stack: ${errorStack}`)
    
    return new Response(JSON.stringify({
      error: `An error occurred while running LLM: ${errorMessage}`,
      stack: errorStack
    }), { status: 500 })
  }
}