// src/pages/api/run-llm.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { OpenAI } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { dbService } from "../../db"
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
  try {
    const body = await request.json()
    const llmServices = body?.llmServices
    const options: ProcessingOptions = body?.options || {}
    
    // Remove sensitive data from logs
    const loggableOptions = { ...options }
    delete loggableOptions.openaiApiKey
    delete loggableOptions.anthropicApiKey
    delete loggableOptions.geminiApiKey
    delete loggableOptions.groqApiKey
    delete loggableOptions.mnemonic
    
    console.log(`${logPrefix} Processing with LLM service: ${llmServices}`)
    
    const frontMatter = options?.frontMatter as string | undefined
    const prompt = options?.promptText as string | undefined
    const transcript = options?.transcript as string | undefined
    
    if (options) {
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey, envKey]) => {
        const value = options[bodyKey]
        if (value) {
          process.env[envKey] = value as string
        }
      })
    }
    
    if (!llmServices) {
      console.warn(`${logPrefix} No LLM service selected. Skipping LLM processing.`)
    }
    
    if (!frontMatter || !prompt || !transcript) {
      return new Response(JSON.stringify({ error: 'frontMatter, prompt, and transcript are required in options' }), { status: 400 })
    }
    
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
    
    const metaFromBody = options['metadata'] as Partial<ShowNoteMetadata> | undefined
    if (metaFromBody) {
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
    
    const baseFilename = `${finalMetadata.publishDate}-${finalMetadata.title}`.replace(/[^a-z0-9\-]/gi, '_').toLowerCase()
    const finalPathBase = path.join('autoshow', 'content', baseFilename)
    
    let showNotesResult = ""
    let userModel = ""
    const numericLLMCost = Number(options.llmCost) || 0
    
    async function retryLLMCall(fn: () => Promise<any>): Promise<any> {
      const maxRetries = 7
      let attempt = 0
      
      while (attempt < maxRetries) {
        try {
          attempt++
          if (attempt > 1) {
            console.log(`${logPrefix} LLM retry attempt ${attempt}`)
          }
          const result = await fn()
          return result
        } catch (error) {
          console.error(`${logPrefix} LLM call failed (attempt ${attempt}):`, error)
          if (attempt >= maxRetries) {
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
      throw new Error('LLM call failed after maximum retries.')
    }
    
    async function callChatGPT(modelValue: ChatGPTModelValue): Promise<LLMResult> {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY')
      }
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      
      try {
        const response = await openai.chat.completions.create({
          model: modelValue,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) {
          throw new Error('No valid response content from ChatGPT API')
        }
        
        const content = firstChoice.message.content
        
        return {
          content,
          usage: {
            stopReason: firstChoice.finish_reason ?? 'unknown',
            input: response.usage?.prompt_tokens,
            output: response.usage?.completion_tokens,
            total: response.usage?.total_tokens
          }
        }
      } catch (error) {
        console.error(`${logPrefix} Error in callChatGPT:`, error)
        throw error
      }
    }
    
    async function callGroq(modelValue: GroqModelValue): Promise<LLMResult> {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('Missing GROQ_API_KEY environment variable.')
      }
      
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
      })
      
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      
      try {
        const response = await groq.chat.completions.create({
          model: modelValue,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) {
          throw new Error('No valid response content from Groq API')
        }
        
        const content = firstChoice.message.content
        
        return {
          content,
          usage: {
            stopReason: firstChoice.finish_reason ?? 'unknown',
            input: response.usage?.prompt_tokens,
            output: response.usage?.completion_tokens,
            total: response.usage?.total_tokens
          }
        }
      } catch (error) {
        console.error(`${logPrefix} Error in callGroq:`, error)
        throw error
      }
    }
    
    async function callClaude(modelValue: ClaudeModelValue): Promise<LLMResult> {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Missing ANTHROPIC_API_KEY environment variable.')
      }
      
      const anthropic = new OpenAI({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com/v1/'
      })
      
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      
      try {
        const response = await anthropic.chat.completions.create({
          model: modelValue,
          max_tokens: 4096,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) {
          throw new Error('No valid text content generated by Claude.')
        }
        
        const content = firstChoice.message.content
        
        return {
          content,
          usage: {
            stopReason: firstChoice.finish_reason ?? 'unknown',
            input: response.usage?.prompt_tokens,
            output: response.usage?.completion_tokens,
            total: response.usage?.total_tokens
          }
        }
      } catch (error) {
        console.error(`${logPrefix} Error in callClaude:`, error)
        throw error
      }
    }
    
    function delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    async function callGemini(modelValue: GeminiModelValue): Promise<LLMResult> {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Missing GEMINI_API_KEY environment variable.')
      }
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const geminiModel = genAI.getGenerativeModel({ model: modelValue })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await geminiModel.generateContent(combinedPrompt)
          const response = result.response
          const text = response.text()
          
          const { usageMetadata } = response
          const { promptTokenCount, candidatesTokenCount, totalTokenCount } = usageMetadata ?? {}
          
          return {
            content: text,
            usage: {
              stopReason: response.candidates?.[0]?.finishReason || 'unknown',
              input: promptTokenCount,
              output: candidatesTokenCount,
              total: totalTokenCount
            }
          }
        } catch (error) {
          console.error(`${logPrefix} Error in callGemini (attempt ${attempt}/${maxRetries}):`, error)
          if (attempt === maxRetries) throw error
          await delay(2 ** attempt * 1000)
        }
      }
      throw new Error('Exhausted all Gemini API call retries without success.')
    }
    
    if (llmServices) {
      console.log(`${logPrefix} Processing with '${llmServices}' Language Model`)
      const config = L_CONFIG[llmServices as keyof typeof L_CONFIG]
      
      if (!config) {
        throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      
      const optionValue = options[llmServices as keyof ProcessingOptions]
      const defaultModelId = config.models[0]?.modelId ?? ''
      
      userModel = typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== ''
        ? optionValue
        : defaultModelId
        
      if (!userModel) {
        throw new Error(`Could not determine a valid model for service ${llmServices}`)
      }
      
      let showNotesData: LLMResult
      
      switch (llmServices) {
        case 'chatgpt':
          showNotesData = await retryLLMCall(() => callChatGPT(userModel as ChatGPTModelValue))
          break
        case 'claude':
          showNotesData = await retryLLMCall(() => callClaude(userModel as ClaudeModelValue))
          break
        case 'gemini':
          showNotesData = await retryLLMCall(() => callGemini(userModel as GeminiModelValue))
          break
        case 'groq':
          showNotesData = await retryLLMCall(() => callGroq(userModel as GroqModelValue))
          break
        default:
          throw new Error(`Unknown or unhandled LLM service: ${llmServices}`)
      }
      
      console.log(`${logPrefix} LLM call successful for service ${llmServices} using model ${userModel}`)
      showNotesResult = showNotesData.content
    } else {
      showNotesResult = "LLM processing skipped."
    }
    
    const numericTranscriptionCost = Number(options.transcriptionCost) || 0
    const finalCost = numericTranscriptionCost + numericLLMCost
    
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
      verifiedRecord = await dbService.getShowNote(newRecord.id)
    }
    
    if (!verifiedRecord) {
      console.error(`${logPrefix} Verification failed - Record with ID ${newRecord.id} not found in database`)
    }
    
    return new Response(JSON.stringify({
      showNote: newRecord,
      showNotesResult
    }), { status: 200 })
  } catch (error) {
    console.error(`${logPrefix} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({
      error: `An error occurred while running LLM: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}