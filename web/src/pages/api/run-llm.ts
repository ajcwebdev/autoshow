// web/src/pages/api/run-llm.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { OpenAI } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { readFile, writeFile, env } from "../../../../src/utils.ts"
import { dbService } from "../../../../src/db.ts"
import { L_CONFIG } from "../../../../shared/constants.ts"
import type { 
  ProcessingOptions, 
  ShowNoteMetadata, 
  LLMResult, 
  ChatGPTModelValue, 
  ClaudeModelValue, 
  GeminiModelValue, 
  GroqModelValue 
} from "../../../../shared/types.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/run-llm] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/run-llm] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const filePath = body?.filePath
    const llmServices = body?.llmServices
    const options: ProcessingOptions = body?.options || {}
    
    console.log(`[api/run-llm] filePath: ${filePath}, llmServices: ${llmServices}`)
    
    if (!filePath) {
      console.error("[api/run-llm] Missing filePath")
      return new Response(JSON.stringify({ error: 'filePath is required' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.join(projectRoot, filePath)
    
    const transcriptionServices = options['transcriptionServices']
    const transcriptionModel = options['transcriptionModel']
    const transcriptionCost = options['transcriptionCost']
    const metaFromBody = options['metadata']
    
    const raw = await readFile(resolvedPath, 'utf8')
    const lines = raw.split('\n')
    let frontMatterLines: string[] = []
    let i = 0
    
    if (lines[0]?.trim() === '---') {
      i = 1
      while (i < lines.length && lines[i]?.trim() !== '---') {
        frontMatterLines.push(lines[i]!)
        i++
      }
      i++
    }
    
    const frontMatter = `---\n${frontMatterLines.join('\n')}\n---`
    const rest = lines.slice(i).join('\n')
    const restLines = rest.split('\n')
    const transcriptIndex = restLines.findIndex(l => l.trim() === '## Transcript')
    
    let prompt = ''
    let transcript = ''
    
    if (transcriptIndex > -1) {
      prompt = restLines.slice(0, transcriptIndex).join('\n').trim()
      transcript = restLines.slice(transcriptIndex + 1).join('\n').trim()
    }
    
    const metadata: ShowNoteMetadata = { 
      showLink: '', 
      channel: '', 
      channelURL: '', 
      title: '', 
      description: '', 
      publishDate: '', 
      coverImage: '', 
      walletAddress: '', 
      mnemonic: '' 
    }
    
    frontMatterLines.forEach(line => {
      if (line) {
        const m = line.match(/^(\w+):\s*"(.*?)"$/)
        if (m && m[1]) {
          const key = m[1]
          const val = m[2] || ''
          if (Object.hasOwn(metadata, key)) metadata[key as keyof ShowNoteMetadata] = val
        }
      }
    })
    
    if (metaFromBody) Object.assign(metadata, metaFromBody)
    
    console.log("[api/run-llm] Processing with Language Model")
    
    metadata.walletAddress = options['walletAddress'] || metadata.walletAddress
    metadata.mnemonic = options['mnemonic'] || metadata.mnemonic
    
    const finalPath = filePath.replace(/\.[^/.]+$/, '')
    let showNotesResult = ''
    let userModel = ''
    const numericLLMCost = Number(options.llmCost) || 0
    
    async function retryLLMCall(fn: () => Promise<any>) {
      const maxRetries = 7
      let attempt = 0
      while (attempt < maxRetries) {
        try {
          attempt++
          console.log(`[api/run-llm] Attempt ${attempt} - Processing LLM call...`)
          const result = await fn()
          console.log(`[api/run-llm] LLM call completed successfully on attempt ${attempt}.`)
          return result
        } catch (error) {
          console.error(`[api/run-llm] Attempt ${attempt} failed: ${error}`)
          if (attempt >= maxRetries) {
            console.error(`[api/run-llm] Max retries (${maxRetries}) reached. Aborting LLM processing.`)
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          console.log(`[api/run-llm] Retrying in ${delayMs / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
      throw new Error('LLM call failed after maximum retries.')
    }
    
    async function callChatGPT(modelValue: ChatGPTModelValue): Promise<LLMResult> {
      if (!env['OPENAI_API_KEY']) throw new Error('Missing OPENAI_API_KEY')
      
      const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })
      const combinedPrompt = `${prompt}\n${transcript}`
      
      try {
        const response = await openai.chat.completions.create({ 
          model: modelValue, 
          max_completion_tokens: 4000, 
          messages: [{ role: 'user', content: combinedPrompt }] 
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) throw new Error('No valid response from the API')
        
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
        console.error(`[api/run-llm] Error in callChatGPT: ${error}`)
        throw error
      }
    }
    
    async function callGroq(modelValue: GroqModelValue): Promise<LLMResult> {
      if (!env['GROQ_API_KEY']) throw new Error('Missing GROQ_API_KEY environment variable.')
      
      const groq = new OpenAI({ 
        apiKey: env['GROQ_API_KEY'], 
        baseURL: 'https://api.groq.com/openai/v1' 
      })
      
      const combinedPrompt = `${prompt}\n${transcript}`
      
      try {
        const response = await groq.chat.completions.create({ 
          model: modelValue, 
          max_completion_tokens: 4000, 
          messages: [{ role: 'user', content: combinedPrompt }] 
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) throw new Error('No valid response from the API')
        
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
        console.error(`[api/run-llm] Error in callGroq: ${error}`)
        throw error
      }
    }
    
    async function callClaude(modelValue: ClaudeModelValue): Promise<LLMResult> {
      if (!env['ANTHROPIC_API_KEY']) throw new Error('Missing ANTHROPIC_API_KEY environment variable.')
      
      const openai = new OpenAI({ 
        apiKey: env['ANTHROPIC_API_KEY'], 
        baseURL: 'https://api.anthropic.com/v1/' 
      })
      
      const combinedPrompt = `${prompt}\n${transcript}`
      
      try {
        const response = await openai.chat.completions.create({ 
          model: modelValue, 
          max_completion_tokens: 4000, 
          messages: [{ role: 'user', content: combinedPrompt }] 
        })
        
        const firstChoice = response.choices[0]
        if (!firstChoice?.message?.content) throw new Error('No valid text content generated by Claude.')
        
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
        console.error(`[api/run-llm] Error in callClaude: ${error}`)
        throw error
      }
    }
    
    function delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    async function callGemini(modelValue: GeminiModelValue): Promise<LLMResult> {
      if (!env['GEMINI_API_KEY']) throw new Error('Missing GEMINI_API_KEY environment variable.')
      
      const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY'])
      const geminiModel = genAI.getGenerativeModel({ model: modelValue })
      const combinedPrompt = `${prompt}\n${transcript}`
      
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await geminiModel.generateContent(combinedPrompt)
          const response = await result.response
          const text = response.text()
          
          const { usageMetadata } = response
          const { promptTokenCount, candidatesTokenCount, totalTokenCount } = usageMetadata ?? {}
          
          return { 
            content: text, 
            usage: { 
              stopReason: 'complete', 
              input: promptTokenCount, 
              output: candidatesTokenCount, 
              total: totalTokenCount 
            } 
          }
        } catch (error) {
          console.error(`[api/run-llm] Error in callGemini (attempt ${attempt}/${maxRetries}): ${error}`)
          if (attempt === maxRetries) throw error
          await delay(2 ** attempt * 1000)
        }
      }
      
      throw new Error('Exhausted all Gemini API call retries without success.')
    }
    
    if (llmServices) {
      console.log(`[api/run-llm] Processing with '${llmServices}' Language Model`)
      
      const config = L_CONFIG[llmServices as keyof typeof L_CONFIG]
      if (!config) throw new Error(`Unknown LLM service: ${llmServices}`)
      
      const optionValue = options[llmServices as keyof ProcessingOptions]
      const defaultModelId = config.models[0]?.modelId ?? ''
      userModel = typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== '' 
        ? optionValue 
        : defaultModelId
      
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
          throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      
      const showNotes = showNotesData.content
      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      
      // Get full output path
      const fullOutputPath = path.join(projectRoot, outputFilename)
      
      await writeFile(fullOutputPath, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      
      console.log(`[api/run-llm] LLM processing completed, output written to: ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      console.log('[api/run-llm] No LLM selected, skipping processing')
      
      const noLLMFile = `${finalPath}-prompt.md`
      const fullNoLLMPath = path.join(projectRoot, noLLMFile)
      
      console.log(`[api/run-llm] Writing front matter + prompt + transcript to: ${noLLMFile}`)
      await writeFile(fullNoLLMPath, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }
    
    const finalCost = (parseFloat(transcriptionCost as string) || 0) + numericLLMCost
    
    const insertedNote = {
      showLink: metadata.showLink ?? '',
      channel: metadata.channel ?? '',
      channelURL: metadata.channelURL ?? '',
      title: metadata.title,
      description: metadata.description ?? '',
      publishDate: metadata.publishDate,
      coverImage: metadata.coverImage ?? '',
      frontmatter: frontMatter,
      prompt,
      transcript,
      llmOutput: showNotesResult,
      walletAddress: metadata.walletAddress ?? '',
      mnemonic: metadata.mnemonic ?? '',
      llmService: llmServices ?? '',
      llmModel: userModel,
      llmCost: numericLLMCost,
      transcriptionService: transcriptionServices ?? '',
      transcriptionModel: transcriptionModel ?? '',
      transcriptionCost,
      finalCost
    }
    
    const newRecord = await dbService.insertShowNote(insertedNote)
    
    console.log("[api/run-llm] Successfully processed LLM request")
    return new Response(JSON.stringify({ 
      showNote: newRecord, 
      showNotesResult 
    }), { status: 200 })
  } catch (error) {
    console.error(`[api/run-llm] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while running LLM: ${errorMessage}` }), { status: 500 })
  }
}