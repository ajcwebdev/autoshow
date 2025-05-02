// src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { execPromise, readFile, existsSync } from "../../utils.ts"
import { T_CONFIG, L_CONFIG, PROMPT_CHOICES } from '../../constants.ts'
import { prompts } from '../../prompts.ts'
import type { ProcessingOptions } from '../../types.ts'

interface DeepgramSentence {
  text: string
  start: number
}

interface DeepgramParagraph {
  sentences: DeepgramSentence[]
}

function formatAssemblyTranscript(paragraphs: any[]): string {
  let txtContent = ''
  paragraphs.forEach(para => {
    const timestamp = formatTimestamp(para.start / 1000)
    txtContent += `[${timestamp}] ${para.text}\n\n`
  })
  return txtContent
}

function formatDeepgramTranscript(result: any): string {
  const paragraphs = result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs || []
  let txtContent = ''
  paragraphs.forEach((para: DeepgramParagraph) => {
    para.sentences.forEach((sentence: DeepgramSentence) => {
      const timestamp: string = formatTimestamp(sentence.start)
      txtContent += `[${timestamp}] ${sentence.text}\n`
    })
    txtContent += '\n'
  })
  return txtContent
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/run-transcription] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/run-transcription] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const finalPath = body?.finalPath
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    const promptSelections = options.prompt || options.printPrompt || ['summary', 'longChapters']
    
    console.log(`[api/run-transcription] finalPath: ${finalPath}, service: ${transcriptServices}`)
    console.log(`[api/run-transcription] options: ${JSON.stringify(options, null, 2)}`)
    console.log(`[api/run-transcription] promptSelections: ${JSON.stringify(promptSelections, null, 2)}`)
    
    if (!finalPath || !transcriptServices) {
      console.error("[api/run-transcription] Missing required parameters")
      return new Response(JSON.stringify({ error: 'finalPath and transcriptServices are required' }), { status: 400 })
    }
    
    if (options.deepgramApiKey) {
      process.env.DEEPGRAM_API_KEY = options.deepgramApiKey
      console.log("[api/run-transcription] Set DEEPGRAM_API_KEY from options")
    }
    
    if (options.assemblyApiKey) {
      process.env.ASSEMBLY_API_KEY = options.assemblyApiKey
      console.log("[api/run-transcription] Set ASSEMBLY_API_KEY from options")
    }
    
    if (transcriptServices === 'deepgram' && !process.env.DEEPGRAM_API_KEY) {
      console.error("[api/run-transcription] DEEPGRAM_API_KEY is not set")
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !process.env.ASSEMBLY_API_KEY) {
      console.error("[api/run-transcription] ASSEMBLY_API_KEY is not set")
      return new Response(JSON.stringify({ error: 'ASSEMBLY_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'deepgram' && !options.deepgram) {
      console.error("[api/run-transcription] Deepgram model must be specified")
      return new Response(JSON.stringify({ error: 'Deepgram model must be specified' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !options.assembly) {
      console.error("[api/run-transcription] Assembly model must be specified")
      return new Response(JSON.stringify({ error: 'Assembly model must be specified' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.join(projectRoot, finalPath)
    console.log(`[api/run-transcription] Project root: ${projectRoot}`)
    console.log(`[api/run-transcription] Resolved path: ${resolvedPath}`)
    
    let promptText = await generatePrompt(options, projectRoot)
    console.log(`[api/run-transcription] Generated prompt (length: ${promptText.length} chars)`)
    console.log(`[api/run-transcription] Prompt preview: ${promptText.substring(0, 200)}...`)
    
    let finalTranscript = ''
    let finalModelId = ''
    let finalCostPerMinuteCents = 0
    
    async function retryTranscriptionCall(fn: () => Promise<any>) {
      const maxRetries = 7
      let attempt = 0
      let lastError = null
      while (attempt < maxRetries) {
        try {
          attempt++
          console.log(`[api/run-transcription] Attempt ${attempt} - Processing transcription...`)
          const result = await fn()
          console.log(`[api/run-transcription] Transcription call completed successfully on attempt ${attempt}.`)
          return result
        } catch (error) {
          lastError = error
          console.error(`[api/run-transcription] Attempt ${attempt} failed: ${error}`)
          if (error instanceof Error) {
            console.error(`[api/run-transcription] Error stack: ${error.stack}`)
          }
          if (attempt >= maxRetries) {
            console.error(`[api/run-transcription] Max retries (${maxRetries}) reached. Aborting transcription.`)
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          console.log(`[api/run-transcription] Retrying in ${delayMs / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
      const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error')
      throw new Error(`Transcription call failed after maximum retries. Last error: ${errorMessage}`)
    }
    
    async function callDeepgram() {
      console.log("[api/run-transcription] Calling Deepgram")
      if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY environment variable is not set.')
      }
      const deepgramModel = typeof options.deepgram === 'string'
        ? options.deepgram
        : null
      if (!deepgramModel) {
        throw new Error('Deepgram model must be specified')
      }
      const modelInfo = T_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === deepgramModel.toLowerCase())
      if (!modelInfo) {
        throw new Error(`Model information for model ${deepgramModel} is not defined.`)
      }
      const { modelId, costPerMinuteCents } = modelInfo
      try {
        const audioBuffer = await readFile(`${resolvedPath}.wav`)
        console.log(`[api/run-transcription] Successfully loaded audio file: ${resolvedPath}.wav (size: ${audioBuffer.length} bytes)`)
      } catch (error) {
        console.error(`[api/run-transcription] Error loading audio file: ${error}`)
        throw new Error(`Failed to load audio file at ${resolvedPath}.wav: ${error instanceof Error ? error.message : String(error)}`)
      }
      const apiUrl = new URL('https://api.deepgram.com/v1/listen')
      apiUrl.searchParams.append('model', modelId)
      apiUrl.searchParams.append('smart_format', 'true')
      apiUrl.searchParams.append('punctuate', 'true')
      apiUrl.searchParams.append('paragraphs', 'true')
      console.log(`[api/run-transcription] Deepgram API URL: ${apiUrl.toString()}`)
      console.log(`[api/run-transcription] Using model: ${modelId}`)
      const audioBuffer = await readFile(`${resolvedPath}.wav`)
      console.log(`[api/run-transcription] Sending audio to Deepgram (${audioBuffer.length} bytes)`)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav'
        },
        body: audioBuffer
      })
      const statusCode = response.status
      console.log(`[api/run-transcription] Deepgram API response status: ${statusCode}`)
      if (!response.ok) {
        let errorMsg = `Deepgram API request failed with status ${statusCode}`
        try {
          const errorBody = await response.text()
          console.error(`[api/run-transcription] Deepgram error body: ${errorBody}`)
          errorMsg += `: ${errorBody}`
        } catch (e) {
          console.error(`[api/run-transcription] Failed to get error body: ${e}`)
        }
        throw new Error(errorMsg)
      }
      let responseText
      try {
        responseText = await response.text()
        console.log(`[api/run-transcription] Deepgram response text (first 200 chars): ${responseText.substring(0, 200)}...`)
      } catch (e) {
        console.error(`[api/run-transcription] Failed to get response text: ${e}`)
        throw new Error(`Failed to read Deepgram response: ${e instanceof Error ? e.message : String(e)}`)
      }
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error(`[api/run-transcription] Failed to parse Deepgram response as JSON: ${e}`)
        throw new Error(`Invalid JSON in Deepgram response: ${e instanceof Error ? e.message : String(e)}. Response text: ${responseText.substring(0, 100)}...`)
      }
      console.log(`[api/run-transcription] Parsed Deepgram response: ${JSON.stringify(result, null, 2).substring(0, 500)}...`)
      const txtContent = formatDeepgramTranscript(result)
      console.log(`[api/run-transcription] Generated transcript text (first 200 chars): ${txtContent.substring(0, 200)}...`)
      return {
        transcript: txtContent,
        modelId,
        costPerMinuteCents
      }
    }
    
    async function callAssembly() {
      console.log("[api/run-transcription] Calling AssemblyAI")
      if (!process.env.ASSEMBLY_API_KEY) {
        throw new Error('ASSEMBLY_API_KEY environment variable is not set.')
      }
      const headers = {
        'Authorization': process.env.ASSEMBLY_API_KEY,
        'Content-Type': 'application/json'
      }
      console.log(`[api/run-transcription] Assembly headers: ${JSON.stringify({
        'Authorization': 'REDACTED',
        'Content-Type': headers['Content-Type'],
      })}`)
      const audioFilePath = `${resolvedPath}.wav`
      try {
        const stats = await execPromise(`ls -la "${audioFilePath}"`)
        console.log(`[api/run-transcription] Audio file exists: ${stats.stdout}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error checking audio file: ${error}`)
        throw new Error(`Audio file does not exist or is not accessible at ${audioFilePath}: ${error instanceof Error ? error.message : String(error)}`)
      }
      const assemblyModel = typeof options.assembly === 'string'
        ? options.assembly
        : null
      if (!assemblyModel) {
        throw new Error('Assembly model must be specified')
      }
      const modelInfo = T_CONFIG.assembly.models.find(m => m.modelId.toLowerCase() === assemblyModel.toLowerCase())
      if (!modelInfo) {
        throw new Error(`Model information for model ${assemblyModel} is not available.`)
      }
      const { modelId, costPerMinuteCents } = modelInfo
      console.log(`[api/run-transcription] Using Assembly model: ${modelId}`)
      let fileBuffer
      try {
        fileBuffer = await readFile(audioFilePath)
        console.log(`[api/run-transcription] Successfully loaded audio file (size: ${fileBuffer.length} bytes)`)
      } catch (error) {
        console.error(`[api/run-transcription] Error loading audio file: ${error}`)
        throw new Error(`Failed to load audio file: ${error instanceof Error ? error.message : String(error)}`)
      }
      console.log(`[api/run-transcription] Uploading file to AssemblyAI...`)
      let uploadResponseText
      let uploadResponse
      try {
        uploadResponse = await fetch(`https://api.assemblyai.com/v2/upload`, {
          method: 'POST',
          headers: {
            'Authorization': process.env.ASSEMBLY_API_KEY,
            'Content-Type': 'application/octet-stream',
          },
          body: fileBuffer
        })
        uploadResponseText = await uploadResponse.text()
        console.log(`[api/run-transcription] Upload response status: ${uploadResponse.status}`)
        console.log(`[api/run-transcription] Upload response text: ${uploadResponseText}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error uploading file: ${error}`)
        throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      if (!uploadResponse.ok) {
        console.error(`[api/run-transcription] Upload failed with status ${uploadResponse.status}: ${uploadResponseText}`)
        throw new Error(`File upload failed with status ${uploadResponse.status}: ${uploadResponseText}`)
      }
      let uploadData
      try {
        uploadData = JSON.parse(uploadResponseText)
        console.log(`[api/run-transcription] Parsed upload response: ${JSON.stringify(uploadData, null, 2)}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error parsing upload response: ${error}`)
        throw new Error(`Invalid JSON in upload response: ${error instanceof Error ? error.message : String(error)}. Response: ${uploadResponseText}`)
      }
      const { upload_url } = uploadData
      if (!upload_url) {
        throw new Error(`Upload URL not returned by AssemblyAI. Response: ${JSON.stringify(uploadData, null, 2)}`)
      }
      console.log(`[api/run-transcription] Got upload URL: ${upload_url}`)
      const transcriptionOptions = {
        audio_url: upload_url,
        speech_model: modelId as 'default' | 'nano'
      }
      console.log(`[api/run-transcription] Requesting transcription with options: ${JSON.stringify(transcriptionOptions, null, 2)}`)
      let transcriptionResponseText
      let response
      try {
        response = await fetch(`https://api.assemblyai.com/v2/transcript`, {
          method: 'POST',
          headers,
          body: JSON.stringify(transcriptionOptions)
        })
        transcriptionResponseText = await response.text()
        console.log(`[api/run-transcription] Transcription request response status: ${response.status}`)
        console.log(`[api/run-transcription] Transcription request response text: ${transcriptionResponseText}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error requesting transcription: ${error}`)
        throw new Error(`Transcription request failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      if (!response.ok) {
        console.error(`[api/run-transcription] Transcription request failed with status ${response.status}: ${transcriptionResponseText}`)
        throw new Error(`HTTP error! status: ${response.status}, body: ${transcriptionResponseText}`)
      }
      let transcriptData
      try {
        transcriptData = JSON.parse(transcriptionResponseText)
        console.log(`[api/run-transcription] Parsed transcription request response: ${JSON.stringify(transcriptData, null, 2)}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error parsing transcription request response: ${error}`)
        throw new Error(`Invalid JSON in transcription request response: ${error instanceof Error ? error.message : String(error)}. Response: ${transcriptionResponseText}`)
      }
      if (!transcriptData.id) {
        throw new Error(`No transcription ID returned by AssemblyAI. Response: ${JSON.stringify(transcriptData, null, 2)}`)
      }
      console.log(`[api/run-transcription] Got transcription ID: ${transcriptData.id}`)
      console.log(`[api/run-transcription] Polling for transcription results...`)
      let transcript
      let pollingAttempts = 0
      const maxPollingAttempts = 60
      while (true) {
        pollingAttempts++
        if (pollingAttempts > maxPollingAttempts) {
          throw new Error(`Transcription polling timed out after ${pollingAttempts} attempts`)
        }
        console.log(`[api/run-transcription] Polling attempt ${pollingAttempts}/${maxPollingAttempts}...`)
        let pollingResponse
        let pollingResponseText
        try {
          pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, { headers })
          pollingResponseText = await pollingResponse.text()
          console.log(`[api/run-transcription] Polling response status: ${pollingResponse.status}`)
          console.log(`[api/run-transcription] Polling response text (first 200 chars): ${pollingResponseText.substring(0, 200)}...`)
        } catch (error) {
          console.error(`[api/run-transcription] Error polling for results: ${error}`)
          throw new Error(`Polling failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        if (!pollingResponse.ok) {
          console.error(`[api/run-transcription] Polling failed with status ${pollingResponse.status}: ${pollingResponseText}`)
          throw new Error(`Polling failed with status ${pollingResponse.status}: ${pollingResponseText}`)
        }
        try {
          transcript = JSON.parse(pollingResponseText)
          console.log(`[api/run-transcription] Transcript status: ${transcript.status}`)
        } catch (error) {
          console.error(`[api/run-transcription] Error parsing polling response: ${error}`)
          throw new Error(`Invalid JSON in polling response: ${error instanceof Error ? error.message : String(error)}. Response: ${pollingResponseText}`)
        }
        if (transcript.status === 'completed' || transcript.status === 'error') {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      if (transcript.status === 'error' || transcript.error) {
        console.error(`[api/run-transcription] Transcription failed: ${JSON.stringify(transcript, null, 2)}`)
        throw new Error(`Transcription failed: ${transcript.error || 'Unknown error'}`)
      }
      console.log(`[api/run-transcription] Transcription completed successfully`)
      let paragraphsResponse
      let paragraphsData
      try {
        paragraphsResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}/paragraphs`, { headers })
        const paragraphsResponseText = await paragraphsResponse.text()
        console.log(`[api/run-transcription] Paragraphs response status: ${paragraphsResponse.status}`)
        console.log(`[api/run-transcription] Paragraphs response text (first 200 chars): ${paragraphsResponseText.substring(0, 200)}...`)
        if (!paragraphsResponse.ok) {
          throw new Error(`Paragraphs request failed with status ${paragraphsResponse.status}: ${paragraphsResponseText}`)
        }
        paragraphsData = JSON.parse(paragraphsResponseText)
      } catch (error) {
        console.error(`[api/run-transcription] Error fetching paragraphs: ${error}`)
        throw new Error(`Paragraphs request failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      const txtContent = formatAssemblyTranscript(paragraphsData.paragraphs)
      console.log(`[api/run-transcription] Generated transcript text (first 200 chars): ${txtContent.substring(0, 200)}...`)
      return {
        transcript: txtContent,
        modelId,
        costPerMinuteCents
      }
    }
    
    async function getAudioDurationInSeconds(filePath: string): Promise<number> {
      console.log(`[api/run-transcription] getAudioDurationInSeconds called with filePath: ${filePath}`)
      if (!existsSync(filePath)) {
        console.error(`[api/run-transcription] File not found: ${filePath}`)
        throw new Error(`File not found: ${filePath}`)
      }
      const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
      console.log(`[api/run-transcription] Executing command: ${cmd}`)
      const { stdout } = await execPromise(cmd)
      console.log(`[api/run-transcription] ffprobe stdout: ${stdout}`)
      const seconds = parseFloat(stdout.trim())
      console.log(`[api/run-transcription] Parsed duration: ${seconds}`)
      if (isNaN(seconds)) {
        throw new Error(`Could not parse audio duration for file: ${filePath}. ffprobe output: ${stdout}`)
      }
      return seconds
    }
    
    async function computeTranscriptionCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
      console.log(`[api/run-transcription] computeTranscriptionCosts called with filePath: ${filePath}`)
      const seconds = await getAudioDurationInSeconds(filePath)
      const minutes = seconds / 60
      console.log(`[api/run-transcription] Total minutes: ${minutes}`)
      const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
      Object.entries(T_CONFIG).forEach(([serviceName, config]) => {
        console.log(`[api/run-transcription] Processing service: ${serviceName}`)
        result[serviceName] = []
        config.models.forEach(model => {
          const cost = model.costPerMinuteCents * minutes
          const finalCost = parseFloat(cost.toFixed(10))
          console.log(`[api/run-transcription] Model: ${model.modelId}, cost: ${finalCost}`)
          result[serviceName].push({ modelId: model.modelId, cost: finalCost })
        })
      })
      console.log(`[api/run-transcription] Final transcriptionCost result: ${JSON.stringify(result)}`)
      return result
    }
    
    async function computeLLMCosts(transcriptLength: number, promptLength: number): Promise<Record<string, Array<{ modelId: string, modelName: string, cost: number }>>> {
      console.log(`[api/run-transcription] computeLLMCosts called with transcriptLength: ${transcriptLength}, promptLength: ${promptLength}`)
      
      const totalInputTokens = Math.max(1, Math.ceil((transcriptLength + promptLength) / 4))
      console.log(`[api/run-transcription] Estimated input tokens: ${totalInputTokens}`)
      
      const estimatedOutputTokens = 4000
      console.log(`[api/run-transcription] Estimated output tokens: ${estimatedOutputTokens}`)
      
      const result: Record<string, Array<{ modelId: string, modelName: string, cost: number }>> = {}
      
      Object.entries(L_CONFIG).forEach(([serviceName, config]) => {
        if (serviceName === 'skip') {
          console.log(`[api/run-transcription] Skipping service: ${serviceName} (no models)`)
          return
        }
        
        if (!config.models || config.models.length === 0) {
          console.log(`[api/run-transcription] Skipping service: ${serviceName}, no models found`)
          return
        }
        
        console.log(`[api/run-transcription] Processing LLM service: ${serviceName}`)
        result[serviceName] = []
        
        config.models.forEach(model => {
          const inputCostRate = (model.inputCostC || 0) / 100
          const outputCostRate = (model.outputCostC || 0) / 100
          
          const inputCost = (totalInputTokens / 1_000_000) * inputCostRate
          const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
          const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
          
          console.log(`[api/run-transcription] Model: ${model.modelId}, inputCostRate: ${inputCostRate}, outputCostRate: ${outputCostRate}, totalCost: ${totalCost}`)
          result[serviceName].push({ 
            modelId: model.modelId, 
            modelName: model.modelName || model.modelId, 
            cost: totalCost 
          })
        })
      })
      
      console.log(`[api/run-transcription] Final llmCost result: ${JSON.stringify(result)}`)
      return result
    }
    
    async function logTranscriptionCost(info: {
      modelId: string
      costPerMinuteCents: number
      filePath: string
    }): Promise<number> {
      console.log(`[api/run-transcription] Calculating transcription cost for ${info.filePath}`)
      const seconds = await getAudioDurationInSeconds(info.filePath)
      const minutes = seconds / 60
      const cost = info.costPerMinuteCents * minutes
      console.log(
        `[api/run-transcription] Estimated Transcription Cost for ${info.modelId}:\n` +
        `Audio Length: ${minutes.toFixed(2)} minutes\n` +
        `Cost: ¢${cost.toFixed(5)}`
      )
      return parseFloat(cost.toFixed(10))
    }
    
    async function generatePrompt(options: ProcessingOptions, projectRoot: string): Promise<string> {
      console.log("[api/run-transcription] Generating prompt based on options")
      let customPrompt = ''
      
      if (options.customPrompt) {
        try {
          console.log(`[api/run-transcription] Reading custom prompt file: ${options.customPrompt}`)
          const customPromptPath = path.join(projectRoot, options.customPrompt)
          customPrompt = (await readFile(customPromptPath, 'utf8')).toString().trim()
          console.log(`[api/run-transcription] Read custom prompt file successfully (length: ${customPrompt.length})`)
        } catch (error) {
          console.error(`[api/run-transcription] Error reading custom prompt file: ${error}`)
        }
      }
      
      if (customPrompt) {
        console.log("[api/run-transcription] Using custom prompt")
        return customPrompt
      }
      
      const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))
      let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"
      
      const promptSelections = options.printPrompt || options.prompt || ['summary', 'longChapters']
      console.log(`[api/run-transcription] Selected prompts: ${JSON.stringify(promptSelections)}`)
      
      const validSections = promptSelections.filter(
        (section): section is keyof typeof prompts =>
          validPromptValues.has(section) && Object.hasOwn(prompts, section)
      )
      
      console.log(`[api/run-transcription] Valid prompts: ${JSON.stringify(validSections, null, 2)}`)
      
      validSections.forEach((section) => {
        text += prompts[section].instruction + "\n"
      })
      
      text += "Format the output like so:\n\n"
      
      validSections.forEach((section) => {
        text += `    ${prompts[section].example}\n`
      })
      
      console.log("[api/run-transcription] Generated prompt successfully")
      return text
    }
    
    switch (transcriptServices) {
      case 'deepgram': {
        const result = await retryTranscriptionCall(callDeepgram)
        console.log('[api/run-transcription] Deepgram transcription completed successfully')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      case 'assembly': {
        const result = await retryTranscriptionCall(callAssembly)
        console.log('[api/run-transcription] AssemblyAI transcription completed successfully')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      default:
        console.error(`[api/run-transcription] Unknown transcription service: ${transcriptServices}`)
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${resolvedPath}.wav`
    })
    
    const allTranscriptionCosts = await computeTranscriptionCosts(`${resolvedPath}.wav`)
    
    const allLLMCosts = await computeLLMCosts(finalTranscript.length, promptText.length)
    
    console.log('[api/run-transcription] Transcription completed successfully')
    console.log(`[api/run-transcription] Transcript length: ${finalTranscript.length}`)
    console.log(`[api/run-transcription] Prompt length: ${promptText.length}`)
    
    return new Response(JSON.stringify({
      transcript: finalTranscript,
      prompt: promptText,
      transcriptionService: transcriptServices,
      transcriptionModel: finalModelId,
      transcriptionCost,
      allTranscriptionCosts,
      allLLMCosts
    }), { status: 200 })
    
  } catch (error) {
    console.error(`[api/run-transcription] Caught error: ${error}`)
    if (error instanceof Error) {
      console.error(`[api/run-transcription] Error stack: ${error.stack}`)
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({
      error: `An error occurred during transcription: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}