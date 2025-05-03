// src/pages/api/run-llm.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { OpenAI } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { writeFile } from "../../utils" // Keep writeFile for potential debug output if needed
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
  console.log(`${logPrefix} POST request started`)
  try {
    const body = await request.json()
    console.log(`${logPrefix} Raw request body parsed`)
    // Log sensitive parts carefully or omit
    console.log(`${logPrefix} Body keys: ${Object.keys(body)}`)
    // const filePath = body?.filePath // No longer used
    const llmServices = body?.llmServices
    const options: ProcessingOptions = body?.options || {}
    // Log received options, omitting sensitive keys if necessary
    const loggableOptions = { ...options }
    delete loggableOptions.openaiApiKey
    delete loggableOptions.anthropicApiKey
    delete loggableOptions.geminiApiKey
    delete loggableOptions.groqApiKey
    delete loggableOptions.mnemonic
    console.log(`${logPrefix} llmServices: ${llmServices}`)
    console.log(`${logPrefix} Loggable options received:`, JSON.stringify(loggableOptions, null, 2))
    // Extract content directly from options
    const frontMatter = options?.frontMatter as string | undefined
    const prompt = options?.promptText as string | undefined // Renamed from 'prompt' to avoid conflict
    const transcript = options?.transcript as string | undefined
    console.log(`${logPrefix} Received frontMatter (length: ${frontMatter?.length ?? 0})`)
    console.log(`${logPrefix} Received prompt (length: ${prompt?.length ?? 0})`)
    console.log(`${logPrefix} Received transcript (length: ${transcript?.length ?? 0})`)
    if (options) {
      console.log(`${logPrefix} Setting environment variables from options...`)
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey, envKey]) => {
        const value = options[bodyKey]
        if (value) {
          console.log(`${logPrefix} Setting process.env.${envKey} from options.${bodyKey}`)
          process.env[envKey] = value as string // Assert as string, handle non-string if necessary
        }
      })
    }
    if (!llmServices) {
      console.warn(`${logPrefix} No LLM service selected (llmServices is falsy). Skipping LLM processing.`)
      // Handle case where no LLM is needed - maybe just save the transcript/prompt?
      // For now, we assume llmService is required if this endpoint is hit meaningfully
    }
    if (!frontMatter || !prompt || !transcript) {
      console.error(`${logPrefix} Missing required content: frontMatter, prompt, or transcript`)
      return new Response(JSON.stringify({ error: 'frontMatter, prompt, and transcript are required in options' }), { status: 400 })
    }
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    console.log(`${logPrefix} Project root: ${projectRoot}`)
    // File reading logic removed
    const frontMatterLines = frontMatter.split('\n').slice(1, -1) // Remove --- delimiters
    console.log(`${logPrefix} Parsed ${frontMatterLines.length} lines from frontMatter`)
    // Parsing metadata from frontMatter
    const metadata: Partial<ShowNoteMetadata> = {} // Use partial initially
    console.log(`${logPrefix} Parsing metadata from front matter lines...`)
    frontMatterLines.forEach(line => {
      if (line) {
        const m = line.match(/^(\w+):\s*"(.*?)"$/)
        if (m && m[1]) {
          const key = m[1]
          const val = m[2] || ''
          console.log(`${logPrefix} Found metadata: ${key} = "${val.substring(0, 50)}${val.length > 50 ? '...' : ''}"`)
          metadata[key as keyof ShowNoteMetadata] = val
        } else {
          console.warn(`${logPrefix} Could not parse metadata line: "${line}"`)
        }
      }
    })
    const metaFromBody = options['metadata'] as Partial<ShowNoteMetadata> | undefined
    if (metaFromBody) {
      console.log(`${logPrefix} Merging metadata from request body options...`)
      Object.assign(metadata, metaFromBody)
      console.log(`${logPrefix} Merged metadata:`, metadata)
    }
    console.log(`${logPrefix} Processing with Language Model`)
    // Ensure required metadata fields have defaults if necessary before DB insertion
    const finalMetadata: ShowNoteMetadata = {
      title: metadata.title || 'Untitled Show Note', // Provide default title
      publishDate: metadata.publishDate || new Date().toISOString().split('T')[0], // Provide default date
      showLink: metadata.showLink,
      channel: metadata.channel,
      channelURL: metadata.channelURL,
      description: metadata.description,
      coverImage: metadata.coverImage,
      walletAddress: options['walletAddress'] as string || metadata.walletAddress,
      mnemonic: options['mnemonic'] as string || metadata.mnemonic // Be careful with logging/storing mnemonics
    }
    // Construct a base filename from metadata for potential output files (if needed for debug)
    const baseFilename = `${finalMetadata.publishDate}-${finalMetadata.title}`.replace(/[^a-z0-9\-]/gi, '_').toLowerCase()
    const finalPathBase = path.join('autoshow', 'content', baseFilename) // Base path without extension
    console.log(`${logPrefix} Base path for potential output: ${finalPathBase}`)
    let showNotesResult = ''
    let userModel = ''
    const numericLLMCost = Number(options.llmCost) || 0
    console.log(`${logPrefix} Numeric LLM cost from options: ${numericLLMCost}`)
    // --- LLM Call Functions (callChatGPT, callGroq, callClaude, callGemini) ---
    // These functions remain largely the same, just ensure they use the 'prompt' and 'transcript' variables passed into this scope.
    // Adding logging within them is good practice.
    async function retryLLMCall(fn: () => Promise<any>): Promise<any> {
      const maxRetries = 7
      let attempt = 0
      console.log(`${logPrefix} Entering retryLLMCall`)
      while (attempt < maxRetries) {
        try {
          attempt++
          console.log(`${logPrefix} retryLLMCall: Attempt ${attempt}`)
          const result = await fn()
          console.log(`${logPrefix} retryLLMCall: Attempt ${attempt} succeeded.`)
          return result
        } catch (error) {
          console.error(`${logPrefix} retryLLMCall: Attempt ${attempt} failed:`, error)
          if (attempt >= maxRetries) {
            console.error(`${logPrefix} retryLLMCall: Max retries reached. Aborting.`)
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          console.log(`${logPrefix} retryLLMCall: Retrying in ${delayMs / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
      throw new Error('LLM call failed after maximum retries.') // Should not be reached if logic is correct
    }
    async function callChatGPT(modelValue: ChatGPTModelValue): Promise<LLMResult> {
      console.log(`${logPrefix} callChatGPT started with model: ${modelValue}`)
      if (!process.env.OPENAI_API_KEY) {
        console.error(`${logPrefix} Missing OPENAI_API_KEY`)
        throw new Error('Missing OPENAI_API_KEY')
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}` // Reconstruct combined prompt
      console.log(`${logPrefix} Combined prompt length for OpenAI: ${combinedPrompt.length}`)
      try {
        const response = await openai.chat.completions.create({
          model: modelValue,
          // max_completion_tokens: 4000, // Consider making max_tokens dynamic or removing if default is ok
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        console.log(`${logPrefix} OpenAI API response received.`)
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) {
          console.error(`${logPrefix} No valid response content from ChatGPT API`)
          throw new Error('No valid response content from the API')
        }
        const content = firstChoice.message.content
        console.log(`${logPrefix} ChatGPT response content length: ${content.length}`)
        console.log(`${logPrefix} ChatGPT usage:`, response.usage)
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
        throw error // Re-throw to be caught by retry logic
      }
    }
    async function callGroq(modelValue: GroqModelValue): Promise<LLMResult> {
      console.log(`${logPrefix} callGroq started with model: ${modelValue}`)
      if (!process.env.GROQ_API_KEY) {
        console.error(`${logPrefix} Missing GROQ_API_KEY`)
        throw new Error('Missing GROQ_API_KEY environment variable.')
      }
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
      })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      console.log(`${logPrefix} Combined prompt length for Groq: ${combinedPrompt.length}`)
      try {
        const response = await groq.chat.completions.create({
          model: modelValue,
          // max_completion_tokens: 4000,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        console.log(`${logPrefix} Groq API response received.`)
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) {
          console.error(`${logPrefix} No valid response content from Groq API`)
          throw new Error('No valid response content from the API')
        }
        const content = firstChoice.message.content
        console.log(`${logPrefix} Groq response content length: ${content.length}`)
        console.log(`${logPrefix} Groq usage:`, response.usage)
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
      console.log(`${logPrefix} callClaude started with model: ${modelValue}`)
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error(`${logPrefix} Missing ANTHROPIC_API_KEY`)
        throw new Error('Missing ANTHROPIC_API_KEY environment variable.')
      }
      // Anthropic SDK might be preferable, but using OpenAI compatible for consistency if it works
      const anthropic = new OpenAI({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com/v1/' // Check if OpenAI library works here
      })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      console.log(`${logPrefix} Combined prompt length for Claude: ${combinedPrompt.length}`)
      try {
        // Note: Anthropic API might require different parameters or structure via OpenAI lib
        const response = await anthropic.chat.completions.create({
          model: modelValue,
          max_tokens: 4096, // Anthropic uses max_tokens
          messages: [{ role: 'user', content: combinedPrompt }]
        })
        console.log(`${logPrefix} Claude API response received.`)
        const firstChoice = response.choices[0] // Adjust based on actual Anthropic response structure if needed
        if (!firstChoice?.message?.content) {
          console.error(`${logPrefix} No valid text content generated by Claude.`)
          throw new Error('No valid text content generated by Claude.')
        }
        const content = firstChoice.message.content
        console.log(`${logPrefix} Claude response content length: ${content.length}`)
        console.log(`${logPrefix} Claude usage:`, response.usage) // Check if usage is reported similarly
        return {
          content,
          usage: {
            stopReason: firstChoice.finish_reason ?? 'unknown', // Adjust as needed
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
      console.log(`${logPrefix} Delaying for ${ms} ms`)
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    async function callGemini(modelValue: GeminiModelValue): Promise<LLMResult> {
      console.log(`${logPrefix} callGemini started with model: ${modelValue}`)
      if (!process.env.GEMINI_API_KEY) {
        console.error(`${logPrefix} Missing GEMINI_API_KEY`)
        throw new Error('Missing GEMINI_API_KEY environment variable.')
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const geminiModel = genAI.getGenerativeModel({ model: modelValue })
      const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
      console.log(`${logPrefix} Combined prompt length for Gemini: ${combinedPrompt.length}`)
      const maxRetries = 3 // Keep retry logic internal to Gemini call if needed
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`${logPrefix} Generating Gemini content attempt ${attempt}`)
          const result = await geminiModel.generateContent(combinedPrompt)
          const response = result.response
          const text = response.text()
          console.log(`${logPrefix} Gemini response text length: ${text.length}`)
          const { usageMetadata } = response
          console.log(`${logPrefix} Gemini usageMetadata:`, usageMetadata)
          const { promptTokenCount, candidatesTokenCount, totalTokenCount } = usageMetadata ?? {}
          return {
            content: text,
            usage: {
              stopReason: response.candidates?.[0]?.finishReason || 'unknown', // Get finish reason
              input: promptTokenCount,
              output: candidatesTokenCount,
              total: totalTokenCount
            }
          }
        } catch (error) {
          console.error(`${logPrefix} Error in callGemini (attempt ${attempt}/${maxRetries}):`, error)
          if (attempt === maxRetries) throw error // Re-throw to be caught by outer retry
          console.log(`${logPrefix} Retrying Gemini after delay...`)
          await delay(2 ** attempt * 1000) // Use internal delay
        }
      }
      // This line should ideally not be reached if retry logic works
      throw new Error('Exhausted all Gemini API call retries without success.')
    }
    // --- End LLM Call Functions ---
    if (llmServices) {
      console.log(`${logPrefix} Processing with '${llmServices}' Language Model`)
      const config = L_CONFIG[llmServices as keyof typeof L_CONFIG]
      if (!config) {
        console.error(`${logPrefix} Unknown LLM service specified: ${llmServices}`)
        throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      const optionValue = options[llmServices as keyof ProcessingOptions]
      const defaultModelId = config.models[0]?.modelId ?? ''
      userModel = typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== ''
        ? optionValue
        : defaultModelId
      console.log(`${logPrefix} Determined userModel: ${userModel}`)
      if (!userModel) {
        console.error(`${logPrefix} Could not determine a valid model for service ${llmServices}`)
        throw new Error(`Could not determine a valid model for service ${llmServices}`)
      }
      let showNotesData: LLMResult
      switch (llmServices) {
        case 'chatgpt':
          console.log(`${logPrefix} Calling ChatGPT via retry logic...`)
          showNotesData = await retryLLMCall(() => callChatGPT(userModel as ChatGPTModelValue))
          break
        case 'claude':
          console.log(`${logPrefix} Calling Claude via retry logic...`)
          showNotesData = await retryLLMCall(() => callClaude(userModel as ClaudeModelValue))
          break
        case 'gemini':
          console.log(`${logPrefix} Calling Gemini via retry logic...`)
          showNotesData = await retryLLMCall(() => callGemini(userModel as GeminiModelValue))
          break
        case 'groq':
          console.log(`${logPrefix} Calling Groq via retry logic...`)
          showNotesData = await retryLLMCall(() => callGroq(userModel as GroqModelValue))
          break
        default:
          console.error(`${logPrefix} LLM service case not handled: ${llmServices}`)
          throw new Error(`Unknown or unhandled LLM service: ${llmServices}`)
      }
      console.log(`${logPrefix} LLM call successful for service ${llmServices}`)
      showNotesResult = showNotesData.content
      console.log(`${logPrefix} Received LLM result length: ${showNotesResult.length}`)
      // Optional: Write output for debugging
      // const outputFilename = `${finalPathBase}-${llmServices}-shownotes.md`
      // const fullOutputPath = path.join(projectRoot, outputFilename)
      // console.log(`${logPrefix} Writing LLM output for debug to: ${fullOutputPath}`)
      // await writeFile(fullOutputPath, `${frontMatter}\n${showNotesResult}\n\n## Transcript\n\n${transcript}`)
    } else {
      console.warn('[api/run-llm] No LLM service selected, skipping LLM processing step.')
      // Handle case where LLM is skipped - perhaps save the prompt/transcript directly?
      showNotesResult = "LLM processing skipped." // Placeholder result
    }
    const numericTranscriptionCost = Number(options.transcriptionCost) || 0
    console.log(`${logPrefix} Numeric transcription cost from options: ${numericTranscriptionCost}`)
    const finalCost = numericTranscriptionCost + numericLLMCost
    console.log(`${logPrefix} Final cost calculation: ${numericTranscriptionCost} (transcription) + ${numericLLMCost} (LLM) = ${finalCost}`)
    const insertedNoteData = {
      // Use finalMetadata which has defaults
      showLink: finalMetadata.showLink || undefined,
      channel: finalMetadata.channel || undefined,
      channelURL: finalMetadata.channelURL || undefined,
      title: finalMetadata.title,
      description: finalMetadata.description || undefined,
      publishDate: finalMetadata.publishDate,
      coverImage: finalMetadata.coverImage || undefined,
      frontmatter: frontMatter, // Store original frontMatter string
      prompt: prompt, // Store original prompt string
      transcript: transcript, // Store original transcript string
      llmOutput: showNotesResult,
      walletAddress: finalMetadata.walletAddress || undefined,
      mnemonic: finalMetadata.mnemonic || undefined, // Storing mnemonic in DB is risky
      llmService: llmServices || undefined,
      llmModel: userModel || undefined,
      llmCost: numericLLMCost, // Assuming ShowNoteType expects number here
      transcriptionService: options.transcriptionServices as string || undefined,
      transcriptionModel: options.transcriptionModel as string || undefined,
      transcriptionCost: numericTranscriptionCost, // Assuming ShowNoteType expects number here
      finalCost: finalCost // Assuming ShowNoteType expects number here
    }
    console.log(`${logPrefix} Preparing to insert show note into database with title: ${insertedNoteData.title}`)
    console.log(`${logPrefix} Insert data keys: ${Object.keys(insertedNoteData)}`)
    // Ensure ShowNoteType compatibility (adjust interface or data as needed)
    const newRecord = await dbService.insertShowNote(insertedNoteData) // Cast might be needed if types differ slightly
    console.log(`${logPrefix} Database insertion complete. New record ID: ${newRecord.id}`)
    // --- Database Verification Logic (remains the same) ---
    let verifiedRecord = null
    if (typeof newRecord.id === 'number') {
      console.log(`${logPrefix} Verifying database insertion by querying record ID: ${newRecord.id}`)
      verifiedRecord = await dbService.getShowNote(newRecord.id)
      console.log(`${logPrefix} Database verification complete`)
      console.log(`${logPrefix} Verified record exists in database: ${Boolean(verifiedRecord)}`)
    } else {
      console.error(`${logPrefix} Invalid or missing record ID after insertion (${newRecord.id}). Skipping verification.`)
    }
    if (verifiedRecord) {
      console.log(`${logPrefix} Verification successful - Record exists in database`)
      console.log(`${logPrefix} Verified record ID: ${verifiedRecord.id}`)
      console.log(`${logPrefix} Verified record title: ${verifiedRecord.title}`)
    } else {
      console.error(`${logPrefix} VERIFICATION FAILED: Record with ID ${newRecord.id} was not found in database`)
      console.error(`${logPrefix} This indicates a potential database consistency issue`)
    }
    // --- End Database Verification ---
    console.log(`${logPrefix} Successfully processed LLM request. Returning new record and result.`)
    return new Response(JSON.stringify({
      showNote: newRecord, // Return the actual record inserted
      showNotesResult // Return the LLM output string
    }), { status: 200 })
  } catch (error) {
    console.error(`${logPrefix} Caught top-level error:`, error)
    console.error(`${logPrefix} Error stack:`, error instanceof Error ? error.stack : 'No stack trace available')
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({
      error: `An error occurred while running LLM: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}