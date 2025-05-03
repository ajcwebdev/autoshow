// src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { execPromise, readFile, existsSync } from "../../utils.ts"
import { T_CONFIG, L_CONFIG, PROMPT_CHOICES } from '../../types.ts'
import { prompts } from '../../prompts.ts'
import type { ProcessingOptions, DeepgramSentence, DeepgramParagraph } from '../../types.ts'

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
  const logPrefix = "[api/run-transcription]"
  try {
    const body = await request.json()
    const finalPath = body?.finalPath
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    const promptSelections = options.prompt || options.printPrompt || ['summary', 'longChapters']
    
    if (!finalPath || !transcriptServices) {
      return new Response(JSON.stringify({ error: 'finalPath and transcriptServices are required' }), { status: 400 })
    }
    
    if (options.deepgramApiKey) {
      process.env.DEEPGRAM_API_KEY = options.deepgramApiKey
    }
    
    if (options.assemblyApiKey) {
      process.env.ASSEMBLY_API_KEY = options.assemblyApiKey
    }
    
    if (transcriptServices === 'deepgram' && !process.env.DEEPGRAM_API_KEY) {
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !process.env.ASSEMBLY_API_KEY) {
      return new Response(JSON.stringify({ error: 'ASSEMBLY_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'deepgram' && !options.deepgram) {
      return new Response(JSON.stringify({ error: 'Deepgram model must be specified' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !options.assembly) {
      return new Response(JSON.stringify({ error: 'Assembly model must be specified' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.join(projectRoot, finalPath)
    
    let promptText = await generatePrompt(options, projectRoot)
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
          if (attempt > 1) {
            console.log(`${logPrefix} Transcription retry attempt ${attempt}`)
          }
          
          const result = await fn()
          return result
        } catch (error) {
          lastError = error
          console.error(`${logPrefix} Transcription attempt ${attempt} failed:`, error)
          
          if (attempt >= maxRetries) {
            throw error
          }
          
          const delayMs = 1000 * 2 ** (attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
      
      const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error')
      throw new Error(`Transcription call failed after maximum retries. Last error: ${errorMessage}`)
    }
    
    async function callDeepgram() {
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
        await readFile(`${resolvedPath}.wav`)
      } catch (error) {
        throw new Error(`Failed to load audio file at ${resolvedPath}.wav: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      const apiUrl = new URL('https://api.deepgram.com/v1/listen')
      apiUrl.searchParams.append('model', modelId)
      apiUrl.searchParams.append('smart_format', 'true')
      apiUrl.searchParams.append('punctuate', 'true')
      apiUrl.searchParams.append('paragraphs', 'true')
      
      const audioBuffer = await readFile(`${resolvedPath}.wav`)
      console.log(`${logPrefix} Sending ${audioBuffer.length} bytes to Deepgram API with model ${modelId}`)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav'
        },
        body: audioBuffer
      })
      
      const statusCode = response.status
      if (!response.ok) {
        let errorMsg = `Deepgram API request failed with status ${statusCode}`
        try {
          const errorBody = await response.text()
          errorMsg += `: ${errorBody}`
        } catch (e) {
          // Ignore error reading error body
        }
        throw new Error(errorMsg)
      }
      
      let responseText
      try {
        responseText = await response.text()
      } catch (e) {
        throw new Error(`Failed to read Deepgram response: ${e instanceof Error ? e.message : String(e)}`)
      }
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Invalid JSON in Deepgram response: ${e instanceof Error ? e.message : String(e)}. Response text: ${responseText.substring(0, 100)}...`)
      }
      
      const txtContent = formatDeepgramTranscript(result)
      return {
        transcript: txtContent,
        modelId,
        costPerMinuteCents
      }
    }
    
    async function callAssembly() {
      if (!process.env.ASSEMBLY_API_KEY) {
        throw new Error('ASSEMBLY_API_KEY environment variable is not set.')
      }
      
      const headers = {
        'Authorization': process.env.ASSEMBLY_API_KEY,
        'Content-Type': 'application/json'
      }
      
      const audioFilePath = `${resolvedPath}.wav`
      try {
        await execPromise(`ls -la "${audioFilePath}"`)
      } catch (error) {
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
      console.log(`${logPrefix} Using Assembly model: ${modelId}`)
      
      let fileBuffer
      try {
        fileBuffer = await readFile(audioFilePath)
      } catch (error) {
        throw new Error(`Failed to load audio file: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      console.log(`${logPrefix} Uploading file to AssemblyAI (${fileBuffer.length} bytes)`)
      let uploadResponse
      let uploadResponseText
      
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
      } catch (error) {
        throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      if (!uploadResponse.ok) {
        throw new Error(`File upload failed with status ${uploadResponse.status}: ${uploadResponseText}`)
      }
      
      let uploadData
      try {
        uploadData = JSON.parse(uploadResponseText)
      } catch (error) {
        throw new Error(`Invalid JSON in upload response: ${error instanceof Error ? error.message : String(error)}. Response: ${uploadResponseText}`)
      }
      
      const { upload_url } = uploadData
      if (!upload_url) {
        throw new Error(`Upload URL not returned by AssemblyAI. Response: ${JSON.stringify(uploadData, null, 2)}`)
      }
      
      const transcriptionOptions = {
        audio_url: upload_url,
        speech_model: modelId as 'default' | 'nano'
      }
      
      console.log(`${logPrefix} Requesting Assembly transcription with model ${modelId}`)
      let response
      let transcriptionResponseText
      
      try {
        response = await fetch(`https://api.assemblyai.com/v2/transcript`, {
          method: 'POST',
          headers,
          body: JSON.stringify(transcriptionOptions)
        })
        transcriptionResponseText = await response.text()
      } catch (error) {
        throw new Error(`Transcription request failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${transcriptionResponseText}`)
      }
      
      let transcriptData
      try {
        transcriptData = JSON.parse(transcriptionResponseText)
      } catch (error) {
        throw new Error(`Invalid JSON in transcription request response: ${error instanceof Error ? error.message : String(error)}. Response: ${transcriptionResponseText}`)
      }
      
      if (!transcriptData.id) {
        throw new Error(`No transcription ID returned by AssemblyAI. Response: ${JSON.stringify(transcriptData, null, 2)}`)
      }
      
      console.log(`${logPrefix} Polling for Assembly transcription results (ID: ${transcriptData.id})`)
      let transcript
      let pollingAttempts = 0
      const maxPollingAttempts = 60
      
      while (true) {
        pollingAttempts++
        if (pollingAttempts > maxPollingAttempts) {
          throw new Error(`Transcription polling timed out after ${pollingAttempts} attempts`)
        }
        
        let pollingResponse
        let pollingResponseText
        
        try {
          pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, { headers })
          pollingResponseText = await pollingResponse.text()
        } catch (error) {
          throw new Error(`Polling failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        
        if (!pollingResponse.ok) {
          throw new Error(`Polling failed with status ${pollingResponse.status}: ${pollingResponseText}`)
        }
        
        try {
          transcript = JSON.parse(pollingResponseText)
        } catch (error) {
          throw new Error(`Invalid JSON in polling response: ${error instanceof Error ? error.message : String(error)}. Response: ${pollingResponseText}`)
        }
        
        if (transcript.status === 'completed' || transcript.status === 'error') {
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      if (transcript.status === 'error' || transcript.error) {
        throw new Error(`Transcription failed: ${transcript.error || 'Unknown error'}`)
      }
      
      console.log(`${logPrefix} Assembly transcription completed successfully, fetching paragraphs`)
      let paragraphsResponse
      let paragraphsData
      
      try {
        paragraphsResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}/paragraphs`, { headers })
        const paragraphsResponseText = await paragraphsResponse.text()
        
        if (!paragraphsResponse.ok) {
          throw new Error(`Paragraphs request failed with status ${paragraphsResponse.status}: ${paragraphsResponseText}`)
        }
        
        paragraphsData = JSON.parse(paragraphsResponseText)
      } catch (error) {
        throw new Error(`Paragraphs request failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      const txtContent = formatAssemblyTranscript(paragraphsData.paragraphs)
      return {
        transcript: txtContent,
        modelId,
        costPerMinuteCents
      }
    }
    
    async function getAudioDurationInSeconds(filePath: string): Promise<number> {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }
      
      const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
      const { stdout } = await execPromise(cmd)
      const seconds = parseFloat(stdout.trim())
      
      if (isNaN(seconds)) {
        throw new Error(`Could not parse audio duration for file: ${filePath}. ffprobe output: ${stdout}`)
      }
      
      return seconds
    }
    
    async function computeTranscriptionCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
      const seconds = await getAudioDurationInSeconds(filePath)
      const minutes = seconds / 60
      
      const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
      
      Object.entries(T_CONFIG).forEach(([serviceName, config]) => {
        result[serviceName] = []
        config.models.forEach(model => {
          const cost = model.costPerMinuteCents * minutes
          const finalCost = parseFloat(cost.toFixed(10))
          result[serviceName].push({ modelId: model.modelId, cost: finalCost })
        })
      })
      
      return result
    }
    
    async function computeLLMCosts(transcriptLength: number, promptLength: number): Promise<Record<string, Array<{ modelId: string, modelName: string, cost: number }>>> {
      const totalInputTokens = Math.max(1, Math.ceil((transcriptLength + promptLength) / 4))
      const estimatedOutputTokens = 4000
      
      const result: Record<string, Array<{ modelId: string, modelName: string, cost: number }>> = {}
      
      Object.entries(L_CONFIG).forEach(([serviceName, config]) => {
        if (serviceName === 'skip') {
          return
        }
        
        if (!config.models || config.models.length === 0) {
          return
        }
        
        result[serviceName] = []
        config.models.forEach(model => {
          const inputCostRate = (model.inputCostC || 0) / 100
          const outputCostRate = (model.outputCostC || 0) / 100
          const inputCost = (totalInputTokens / 1_000_000) * inputCostRate
          const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
          const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
          
          result[serviceName].push({
            modelId: model.modelId,
            modelName: model.modelName || model.modelId,
            cost: totalCost
          })
        })
      })
      
      return result
    }
    
    async function logTranscriptionCost(info: {
      modelId: string
      costPerMinuteCents: number
      filePath: string
    }): Promise<number> {
      const seconds = await getAudioDurationInSeconds(info.filePath)
      const minutes = seconds / 60
      const cost = info.costPerMinuteCents * minutes
      
      console.log(
        `${logPrefix} Estimated cost for ${info.modelId}: ${minutes.toFixed(2)} minutes at ¢${info.costPerMinuteCents} = ¢${cost.toFixed(5)}`
      )
      
      return parseFloat(cost.toFixed(10))
    }
    
    async function generatePrompt(options: ProcessingOptions, projectRoot: string): Promise<string> {
      let customPrompt = ''
      
      if (options.customPrompt) {
        try {
          const customPromptPath = path.join(projectRoot, options.customPrompt)
          customPrompt = (await readFile(customPromptPath, 'utf8')).toString().trim()
        } catch (error) {
          console.error(`${logPrefix} Error reading custom prompt file:`, error)
        }
      }
      
      if (customPrompt) {
        return customPrompt
      }
      
      const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))
      let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"
      
      const promptSelections = options.printPrompt || options.prompt || ['summary', 'longChapters']
      
      const validSections = promptSelections.filter(
        (section): section is keyof typeof prompts =>
          validPromptValues.has(section) && Object.hasOwn(prompts, section)
      )
      
      validSections.forEach((section) => {
        text += prompts[section].instruction + "\n"
      })
      
      text += "Format the output like so:\n\n"
      
      validSections.forEach((section) => {
        text += `    ${prompts[section].example}\n`
      })
      
      return text
    }
    
    console.log(`${logPrefix} Starting transcription with service: ${transcriptServices}`)
    
    switch (transcriptServices) {
      case 'deepgram': {
        const result = await retryTranscriptionCall(callDeepgram)
        console.log(`${logPrefix} Deepgram transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      case 'assembly': {
        const result = await retryTranscriptionCall(callAssembly)
        console.log(`${logPrefix} AssemblyAI transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      default:
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${resolvedPath}.wav`
    })
    
    const allTranscriptionCosts = await computeTranscriptionCosts(`${resolvedPath}.wav`)
    const allLLMCosts = await computeLLMCosts(finalTranscript.length, promptText.length)
    
    console.log(`${logPrefix} Transcription complete: ${finalTranscript.length} characters, model: ${finalModelId}, cost: ¢${transcriptionCost.toFixed(5)}`)
    
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
    console.error(`${logPrefix} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({
      error: `An error occurred during transcription: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}