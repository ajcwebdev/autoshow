// web/src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { execPromise, readFile } from "../../utils.ts"
import { T_CONFIG } from '../../constants.ts'
import type { ProcessingOptions, DeepgramWord } from '../../types.ts'

export function formatAssemblyTranscript(transcript: any, speakerLabels: boolean) {
  const inlineFormatTime = (timestamp: number): string => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const seconds = (totalSeconds % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  let txtContent = ''
  if (transcript.utterances && transcript.utterances.length > 0) {
    txtContent = transcript.utterances.map((utt: any) =>
      `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${inlineFormatTime(utt.start)}): ${utt.text}`
    ).join('\n')
  } else if (transcript.words && transcript.words.length > 0) {
    const firstWord = transcript.words[0]
    if (!firstWord) {
      throw new Error('No words found in transcript')
    }
    let currentLine = ''
    let currentTimestamp = inlineFormatTime(firstWord.start)
    transcript.words.forEach((word: any) => {
      if (currentLine.length + word.text.length > 80) {
        txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
        currentLine = ''
        currentTimestamp = inlineFormatTime(word.start)
      }
      currentLine += `${word.text} `
    })
    if (currentLine.length > 0) {
      txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
    }
  } else {
    txtContent = transcript.text || 'No transcription available.'
  }
  return txtContent
}

export function formatDeepgramTranscript(
  words: DeepgramWord[],
  speakerLabels: boolean
): string {
  if (!speakerLabels) {
    return words.map(w => w.word).join(' ')
  }
  let transcript = ''
  let currentSpeaker = words.length > 0 && words[0] ? words[0].speaker ?? undefined : undefined
  let speakerWords: string[] = []
  for (const w of words) {
    if (w.speaker !== currentSpeaker) {
      transcript += `Speaker ${currentSpeaker}: ${speakerWords.join(' ')}\n\n`
      currentSpeaker = w.speaker
      speakerWords = []
    }
    speakerWords.push(w.word)
  }
  if (speakerWords.length > 0) {
    transcript += `Speaker ${currentSpeaker}: ${speakerWords.join(' ')}`
  }
  return transcript
}

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/run-transcription] POST request started")
  
  try {
    const body = await request.json()
    console.log(`[api/run-transcription] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const finalPath = body?.finalPath
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    
    console.log(`[api/run-transcription] finalPath: ${finalPath}, service: ${transcriptServices}`)
    console.log(`[api/run-transcription] options: ${JSON.stringify(options, null, 2)}`)
    
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
    
    // Validate API keys are actually set
    if (transcriptServices === 'deepgram' && !process.env.DEEPGRAM_API_KEY) {
      console.error("[api/run-transcription] DEEPGRAM_API_KEY is not set")
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !process.env.ASSEMBLY_API_KEY) {
      console.error("[api/run-transcription] ASSEMBLY_API_KEY is not set")
      return new Response(JSON.stringify({ error: 'ASSEMBLY_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.join(projectRoot, finalPath)
    
    console.log(`[api/run-transcription] Project root: ${projectRoot}`)
    console.log(`[api/run-transcription] Resolved path: ${resolvedPath}`)
    
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
      
      const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
      throw new Error(`Transcription call failed after maximum retries. Last error: ${errorMessage}`)
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
      
      // Check if the audio file exists
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
      apiUrl.searchParams.append('diarize', options.speakerLabels ? 'true' : 'false')
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
      
      const channel = result.results?.channels?.[0]
      const alternative = channel?.alternatives?.[0]
      
      if (!alternative?.words || !Array.isArray(alternative.words) || alternative.words.length === 0) {
        console.error(`[api/run-transcription] No words found in Deepgram response: ${JSON.stringify(result, null, 2)}`)
        throw new Error('No transcription results found in Deepgram response')
      }
      
      const txtContent = formatDeepgramTranscript(alternative.words, options.speakerLabels || false)
      
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
      
      const { speakerLabels } = options
      const audioFilePath = `${resolvedPath}.wav`
      
      // Check if the audio file exists
      try {
        const stats = await execPromise(`ls -la "${audioFilePath}"`)
        console.log(`[api/run-transcription] Audio file exists: ${stats.stdout}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error checking audio file: ${error}`)
        throw new Error(`Audio file does not exist or is not accessible at ${audioFilePath}: ${error instanceof Error ? error.message : String(error)}`)
      }
      
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
      
      console.log(`[api/run-transcription] Using Assembly model: ${modelId}`)
      
      // Load the file
      let fileBuffer
      try {
        fileBuffer = await readFile(audioFilePath)
        console.log(`[api/run-transcription] Successfully loaded audio file (size: ${fileBuffer.length} bytes)`)
      } catch (error) {
        console.error(`[api/run-transcription] Error loading audio file: ${error}`)
        throw new Error(`Failed to load audio file: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      // Upload the file
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
      
      // Request transcription
      const transcriptionOptions = {
        audio_url: upload_url,
        speech_model: modelId as 'default' | 'nano',
        speaker_labels: speakerLabels || false
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
      
      // Poll for results
      console.log(`[api/run-transcription] Polling for transcription results...`)
      
      let transcript
      let pollingAttempts = 0
      const maxPollingAttempts = 60 // 3 minutes maximum (with 3s interval)
      
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
      
      const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)
      
      console.log(`[api/run-transcription] Generated transcript text (first 200 chars): ${txtContent.substring(0, 200)}...`)
      
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
      console.log(`[api/run-transcription] Calculating transcription cost for ${info.filePath}`)
      
      const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
      console.log(`[api/run-transcription] Running command: ${cmd}`)
      
      let stdout
      try {
        const result = await execPromise(cmd)
        stdout = result.stdout
        console.log(`[api/run-transcription] Command output: ${stdout}`)
      } catch (error) {
        console.error(`[api/run-transcription] Error running ffprobe: ${error}`)
        throw new Error(`Could not determine audio duration: ${error instanceof Error ? error.message : String(error)}`)
      }
      
      const seconds = parseFloat(stdout.trim())
      
      if (isNaN(seconds)) {
        console.error(`[api/run-transcription] Could not parse audio duration: "${stdout}"`)
        throw new Error(`Could not parse audio duration for file: ${info.filePath}. ffprobe output: ${stdout}`)
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
        console.error(`[api/run-transcription] Unknown transcription service: ${transcriptServices}`)
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