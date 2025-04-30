// web/src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { execPromise, readFile, env } from "../../../../src/utils.ts"
import { T_CONFIG } from "../../../../shared/constants.ts"
import { formatDeepgramTranscript, formatAssemblyTranscript } from "../../../../src/server/03-run-transcription.ts"
import type { ProcessingOptions } from "../../../../shared/types.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/run-transcription] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/run-transcription] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const finalPath = body?.finalPath
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    
    console.log(`[api/run-transcription] finalPath: ${finalPath}, service: ${transcriptServices}`)
    
    if (!finalPath || !transcriptServices) {
      console.error("[api/run-transcription] Missing required parameters")
      return new Response(JSON.stringify({ error: 'finalPath and transcriptServices are required' }), { status: 400 })
    }
    
    // Set environment variables from options before calling any APIs
    if (options.deepgramApiKey) {
      process.env.DEEPGRAM_API_KEY = options.deepgramApiKey
      console.log("[api/run-transcription] Set DEEPGRAM_API_KEY from options")
    }
    
    if (options.assemblyApiKey) {
      process.env.ASSEMBLY_API_KEY = options.assemblyApiKey
      console.log("[api/run-transcription] Set ASSEMBLY_API_KEY from options")
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.join(projectRoot, finalPath)
    
    let finalTranscript = ''
    let finalModelId = ''
    let finalCostPerMinuteCents = 0
    
    async function retryTranscriptionCall(fn: () => Promise<any>) {
      const maxRetries = 7
      let attempt = 0
      while (attempt < maxRetries) {
        try {
          attempt++
          console.log(`[api/run-transcription] Attempt ${attempt} - Processing transcription...`)
          const result = await fn()
          console.log(`[api/run-transcription] Transcription call completed successfully on attempt ${attempt}.`)
          return result
        } catch (error) {
          console.error(`[api/run-transcription] Attempt ${attempt} failed: ${error}`)
          if (attempt >= maxRetries) {
            console.error(`[api/run-transcription] Max retries (${maxRetries}) reached. Aborting transcription.`)
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          console.log(`[api/run-transcription] Retrying in ${delayMs / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
      throw new Error('Transcription call failed after maximum retries.')
    }
    
    async function callDeepgram() {
      console.log("[api/run-transcription] Calling Deepgram")
      if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY environment variable is not set.')
      }
      
      const defaultDeepgramModel = T_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')?.modelId || 'nova-2'
      const deepgramModel = typeof options.deepgram === 'string'
        ? options.deepgram
        : defaultDeepgramModel
        
      const modelInfo =
        T_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === deepgramModel.toLowerCase())
        || T_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')
        
      if (!modelInfo) {
        throw new Error(`Model information for model ${deepgramModel} is not defined.`)
      }
      
      const { modelId, costPerMinuteCents } = modelInfo
      const apiUrl = new URL('https://api.deepgram.com/v1/listen')
      
      apiUrl.searchParams.append('model', modelId)
      apiUrl.searchParams.append('smart_format', 'true')
      apiUrl.searchParams.append('punctuate', 'true')
      apiUrl.searchParams.append('diarize', options.speakerLabels ? 'true' : 'false')
      apiUrl.searchParams.append('paragraphs', 'true')
      
      const audioBuffer = await readFile(`${resolvedPath}.wav`)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav'
        },
        body: audioBuffer
      })
      
      if (!response.ok) {
        throw new Error(`Deepgram API request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      const channel = result.results?.channels?.[0]
      const alternative = channel?.alternatives?.[0]
      
      if (!alternative?.words) {
        throw new Error('No transcription results found in Deepgram response')
      }
      
      const txtContent = formatDeepgramTranscript(alternative.words, options.speakerLabels || false)
      
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
      
      const { speakerLabels } = options
      const audioFilePath = `${resolvedPath}.wav`
      
      const defaultAssemblyModel = T_CONFIG.assembly.models.find(m => m.modelId === 'best')?.modelId || 'best'
      const assemblyModel = typeof options.assembly === 'string'
        ? options.assembly
        : defaultAssemblyModel
        
      const modelInfo =
        T_CONFIG.assembly.models.find(m => m.modelId.toLowerCase() === assemblyModel.toLowerCase())
        || T_CONFIG.assembly.models.find(m => m.modelId === 'best')
        
      if (!modelInfo) {
        throw new Error(`Model information for model ${assemblyModel} is not available.`)
      }
      
      const { modelId, costPerMinuteCents } = modelInfo
      const fileBuffer = await readFile(audioFilePath)
      
      const uploadResponse = await fetch(`https://api.assemblyai.com/v2/upload`, {
        method: 'POST',
        headers: {
          'Authorization': process.env.ASSEMBLY_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer
      })
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(`File upload failed: ${errorData.error || uploadResponse.statusText}`)
      }
      
      const uploadData = await uploadResponse.json()
      const { upload_url } = uploadData
      
      if (!upload_url) {
        throw new Error('Upload URL not returned by AssemblyAI.')
      }
      
      const transcriptionOptions = {
        audio_url: upload_url,
        speech_model: modelId as 'default' | 'nano',
        speaker_labels: speakerLabels || false
      }
      
      const response = await fetch(`https://api.assemblyai.com/v2/transcript`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transcriptionOptions)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const transcriptData = await response.json()
      let transcript
      
      while (true) {
        const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, { headers })
        transcript = await pollingResponse.json()
        
        if (transcript.status === 'completed' || transcript.status === 'error') {
          break
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      if (transcript.status === 'error' || transcript.error) {
        throw new Error(`Transcription failed: ${transcript.error}`)
      }
      
      const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)
      
      return {
        transcript: txtContent,
        modelId,
        costPerMinuteCents
      }
    }
    
    async function logTranscriptionCost(info: {
      modelId: string
      costPerMinuteCents: number
      filePath: string
    }) {
      const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
      const { stdout } = await execPromise(cmd)
      const seconds = parseFloat(stdout.trim())
      
      if (isNaN(seconds)) {
        throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
      }
      
      const minutes = seconds / 60
      const cost = info.costPerMinuteCents * minutes
      
      console.log(
        `[api/run-transcription] Estimated Transcription Cost for ${info.modelId}:\n` +
        `Audio Length: ${minutes.toFixed(2)} minutes\n` +
        `Cost: ¢${cost.toFixed(5)}`
      )
      
      return parseFloat(cost.toFixed(10))
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
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${resolvedPath}.wav`
    })
    
    console.log('[api/run-transcription] Transcription completed successfully')
    return new Response(JSON.stringify({
      transcript: finalTranscript,
      transcriptionCost,
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents
    }), { status: 200 })
  } catch (error) {
    console.error(`[api/run-transcription] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred during transcription: ${errorMessage}` }), { status: 500 })
  }
}