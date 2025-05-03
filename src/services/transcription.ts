// src/services/transcription.ts

import { execPromise, readFile, existsSync } from "../utils"
import { T_CONFIG } from '../types'
import type { DeepgramParagraph, DeepgramSentence } from '../types'

const logPrefix = "[transcription.service]"

export function formatTimestamp(seconds: number): string {
  console.log(`${logPrefix}:formatTimestamp Formatting timestamp for ${seconds} seconds`)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  console.log(`${logPrefix}:formatTimestamp Formatted timestamp: ${formattedTime}`)
  return formattedTime
}

export function formatAssemblyTranscript(paragraphs: any[]): string {
  console.log(`${logPrefix}:formatAssemblyTranscript Formatting ${paragraphs.length} paragraphs from AssemblyAI`)
  let txtContent = ''
  
  paragraphs.forEach((para, index) => {
    console.log(`${logPrefix}:formatAssemblyTranscript Processing paragraph ${index+1}/${paragraphs.length}`)
    const timestamp = formatTimestamp(para.start / 1000)
    txtContent += `[${timestamp}] ${para.text}\n\n`
  })
  
  console.log(`${logPrefix}:formatAssemblyTranscript Formatting complete, content length: ${txtContent.length}`)
  return txtContent
}

export function formatDeepgramTranscript(result: any): string {
  console.log(`${logPrefix}:formatDeepgramTranscript Formatting transcript from Deepgram`)
  
  const paragraphs = result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs || []
  console.log(`${logPrefix}:formatDeepgramTranscript Found ${paragraphs.length} paragraphs to format`)
  
  let txtContent = ''
  
  paragraphs.forEach((para: DeepgramParagraph, paraIndex: number) => {
    console.log(`${logPrefix}:formatDeepgramTranscript Processing paragraph ${paraIndex+1}/${paragraphs.length} with ${para.sentences.length} sentences`)
    
    para.sentences.forEach((sentence: DeepgramSentence, sentIndex: number) => {
      console.log(`${logPrefix}:formatDeepgramTranscript Processing sentence ${sentIndex+1}/${para.sentences.length}`)
      const timestamp: string = formatTimestamp(sentence.start)
      txtContent += `[${timestamp}] ${sentence.text}\n`
    })
    
    txtContent += '\n'
  })
  
  console.log(`${logPrefix}:formatDeepgramTranscript Formatting complete, content length: ${txtContent.length}`)
  return txtContent
}

export async function retryTranscriptionCall(fn: () => Promise<any>) {
  console.log(`${logPrefix}:retryTranscriptionCall Starting transcription call with retry logic`)
  
  const maxRetries = 7
  let attempt = 0
  let lastError = null
  
  while (attempt < maxRetries) {
    try {
      attempt++
      if (attempt > 1) {
        console.log(`${logPrefix}:retryTranscriptionCall Retry attempt ${attempt}/${maxRetries}`)
      }
      
      console.log(`${logPrefix}:retryTranscriptionCall Executing transcription function (attempt ${attempt})`)
      const result = await fn()
      console.log(`${logPrefix}:retryTranscriptionCall Transcription call succeeded on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error
      console.error(`${logPrefix}:retryTranscriptionCall Transcription attempt ${attempt} failed:`, error)
      
      if (attempt >= maxRetries) {
        console.error(`${logPrefix}:retryTranscriptionCall Reached maximum retry attempts (${maxRetries})`)
        throw error
      }
      
      const delayMs = 1000 * 2 ** (attempt - 1)
      console.log(`${logPrefix}:retryTranscriptionCall Waiting ${delayMs}ms before next attempt`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error')
  console.error(`${logPrefix}:retryTranscriptionCall Transcription call failed after maximum retries. Last error: ${errorMessage}`)
  throw new Error(`Transcription call failed after maximum retries. Last error: ${errorMessage}`)
}

export async function getAudioDurationInSeconds(filePath: string): Promise<number> {
  console.log(`${logPrefix}:getAudioDurationInSeconds Getting duration for file: ${filePath}`)
  
  if (!existsSync(filePath)) {
    console.error(`${logPrefix}:getAudioDurationInSeconds File not found: ${filePath}`)
    throw new Error(`File not found: ${filePath}`)
  }
  
  console.log(`${logPrefix}:getAudioDurationInSeconds Running ffprobe to get duration`)
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  
  const { stdout } = await execPromise(cmd)
  console.log(`${logPrefix}:getAudioDurationInSeconds Raw ffprobe output: "${stdout.trim()}"`)
  
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    console.error(`${logPrefix}:getAudioDurationInSeconds Could not parse audio duration from ffprobe output`)
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  
  console.log(`${logPrefix}:getAudioDurationInSeconds Audio duration: ${seconds} seconds`)
  return seconds
}

export async function computeTranscriptionCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
  console.log(`${logPrefix}:computeTranscriptionCosts Computing transcription costs for file: ${filePath}`)
  
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  console.log(`${logPrefix}:computeTranscriptionCosts Audio duration: ${seconds} seconds (${minutes.toFixed(2)} minutes)`)
  
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  
  Object.entries(T_CONFIG).forEach(([serviceName, config]) => {
    console.log(`${logPrefix}:computeTranscriptionCosts Calculating costs for service: ${serviceName}`)
    result[serviceName] = []
    
    config.models.forEach(model => {
      const cost = model.costPerMinuteCents * minutes
      const finalCost = parseFloat(cost.toFixed(10))
      
      console.log(`${logPrefix}:computeTranscriptionCosts ${serviceName}/${model.modelId}: ${minutes.toFixed(2)} minutes at ¢${model.costPerMinuteCents} = ¢${finalCost}`)
      
      result[serviceName].push({ modelId: model.modelId, cost: finalCost })
    })
  })
  
  console.log(`${logPrefix}:computeTranscriptionCosts Completed cost calculations`)
  return result
}

export async function logTranscriptionCost(info: {
  modelId: string
  costPerMinuteCents: number
  filePath: string
}): Promise<number> {
  console.log(`${logPrefix}:logTranscriptionCost Logging cost for model ${info.modelId} on file ${info.filePath}`)
  
  const seconds = await getAudioDurationInSeconds(info.filePath)
  const minutes = seconds / 60
  const cost = info.costPerMinuteCents * minutes
  
  console.log(
    `${logPrefix}:logTranscriptionCost Estimated cost for ${info.modelId}: ${minutes.toFixed(2)} minutes at ¢${info.costPerMinuteCents} = ¢${cost.toFixed(5)}`
  )
  
  return parseFloat(cost.toFixed(10))
}

export async function callDeepgram(resolvedPath: string, deepgramModel: string | null, deepgramApiKey: string): Promise<{
  transcript: string
  modelId: string
  costPerMinuteCents: number
}> {
  const methodLogPrefix = `${logPrefix}:callDeepgram`
  console.log(`${methodLogPrefix} Starting Deepgram transcription with model: ${deepgramModel}`)
  
  if (!deepgramApiKey) {
    console.error(`${methodLogPrefix} DEEPGRAM_API_KEY environment variable is not set`)
    throw new Error('DEEPGRAM_API_KEY environment variable is not set.')
  }
  
  if (!deepgramModel) {
    console.error(`${methodLogPrefix} Deepgram model must be specified`)
    throw new Error('Deepgram model must be specified')
  }
  
  const modelInfo = T_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === deepgramModel.toLowerCase())
  if (!modelInfo) {
    console.error(`${methodLogPrefix} Model information for model ${deepgramModel} is not defined`)
    throw new Error(`Model information for model ${deepgramModel} is not defined.`)
  }
  
  const { modelId, costPerMinuteCents } = modelInfo
  console.log(`${methodLogPrefix} Using Deepgram model: ${modelId} with cost: ¢${costPerMinuteCents} per minute`)
  
  try {
    console.log(`${methodLogPrefix} Reading audio file at ${resolvedPath}.wav`)
    await readFile(`${resolvedPath}.wav`)
  } catch (error) {
    console.error(`${methodLogPrefix} Failed to load audio file:`, error)
    throw new Error(`Failed to load audio file at ${resolvedPath}.wav: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  const apiUrl = new URL('https://api.deepgram.com/v1/listen')
  apiUrl.searchParams.append('model', modelId)
  apiUrl.searchParams.append('smart_format', 'true')
  apiUrl.searchParams.append('punctuate', 'true')
  apiUrl.searchParams.append('paragraphs', 'true')
  
  console.log(`${methodLogPrefix} Configured Deepgram API URL with parameters:`, 
    Object.fromEntries(apiUrl.searchParams.entries()))
  
  const audioBuffer = await readFile(`${resolvedPath}.wav`)
  console.log(`${methodLogPrefix} Sending ${audioBuffer.length} bytes to Deepgram API with model ${modelId}`)
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${deepgramApiKey}`,
      'Content-Type': 'audio/wav'
    },
    body: audioBuffer
  })
  
  const statusCode = response.status
  console.log(`${methodLogPrefix} Received response with status: ${statusCode}`)
  
  if (!response.ok) {
    let errorMsg = `Deepgram API request failed with status ${statusCode}`
    try {
      const errorBody = await response.text()
      errorMsg += `: ${errorBody}`
    } catch (e) {
      console.error(`${methodLogPrefix} Failed to read error response body:`, e)
    }
    
    console.error(`${methodLogPrefix} ${errorMsg}`)
    throw new Error(errorMsg)
  }
  
  let responseText
  try {
    responseText = await response.text()
    console.log(`${methodLogPrefix} Received response text of length: ${responseText.length}`)
  } catch (e) {
    console.error(`${methodLogPrefix} Failed to read Deepgram response:`, e)
    throw new Error(`Failed to read Deepgram response: ${e instanceof Error ? e.message : String(e)}`)
  }
  
  let result
  try {
    result = JSON.parse(responseText)
    console.log(`${methodLogPrefix} Successfully parsed JSON response`)
  } catch (e) {
    console.error(`${methodLogPrefix} Invalid JSON in Deepgram response:`, e)
    throw new Error(`Invalid JSON in Deepgram response: ${e instanceof Error ? e.message : String(e)}. Response text: ${responseText.substring(0, 100)}...`)
  }
  
  console.log(`${methodLogPrefix} Formatting Deepgram transcript`)
  const txtContent = formatDeepgramTranscript(result)
  console.log(`${methodLogPrefix} Successfully formatted transcript, length: ${txtContent.length}`)
  
  return {
    transcript: txtContent,
    modelId,
    costPerMinuteCents
  }
}

export async function callAssembly(resolvedPath: string, assemblyModel: string | null, assemblyApiKey: string): Promise<{
  transcript: string
  modelId: string
  costPerMinuteCents: number
}> {
  const methodLogPrefix = `${logPrefix}:callAssembly`
  console.log(`${methodLogPrefix} Starting AssemblyAI transcription with model: ${assemblyModel}`)
  
  if (!assemblyApiKey) {
    console.error(`${methodLogPrefix} ASSEMBLY_API_KEY environment variable is not set`)
    throw new Error('ASSEMBLY_API_KEY environment variable is not set.')
  }
  
  const headers = {
    'Authorization': assemblyApiKey,
    'Content-Type': 'application/json'
  }
  
  const audioFilePath = `${resolvedPath}.wav`
  console.log(`${methodLogPrefix} Using audio file path: ${audioFilePath}`)
  
  try {
    console.log(`${methodLogPrefix} Checking if audio file exists`)
    await execPromise(`ls -la "${audioFilePath}"`)
  } catch (error) {
    console.error(`${methodLogPrefix} Audio file does not exist or is not accessible:`, error)
    throw new Error(`Audio file does not exist or is not accessible at ${audioFilePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  if (!assemblyModel) {
    console.error(`${methodLogPrefix} Assembly model must be specified`)
    throw new Error('Assembly model must be specified')
  }
  
  const modelInfo = T_CONFIG.assembly.models.find(m => m.modelId.toLowerCase() === assemblyModel.toLowerCase())
  if (!modelInfo) {
    console.error(`${methodLogPrefix} Model information for model ${assemblyModel} is not available`)
    throw new Error(`Model information for model ${assemblyModel} is not available.`)
  }
  
  const { modelId, costPerMinuteCents } = modelInfo
  console.log(`${methodLogPrefix} Using Assembly model: ${modelId} with cost: ¢${costPerMinuteCents} per minute`)
  
  let fileBuffer
  try {
    console.log(`${methodLogPrefix} Reading audio file`)
    fileBuffer = await readFile(audioFilePath)
    console.log(`${methodLogPrefix} Successfully read audio file, size: ${fileBuffer.length} bytes`)
  } catch (error) {
    console.error(`${methodLogPrefix} Failed to load audio file:`, error)
    throw new Error(`Failed to load audio file: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  console.log(`${methodLogPrefix} Uploading file to AssemblyAI (${fileBuffer.length} bytes)`)
  let uploadResponse
  let uploadResponseText
  
  try {
    uploadResponse = await fetch(`https://api.assemblyai.com/v2/upload`, {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer
    })
    
    console.log(`${methodLogPrefix} Received upload response with status: ${uploadResponse.status}`)
    uploadResponseText = await uploadResponse.text()
  } catch (error) {
    console.error(`${methodLogPrefix} File upload failed:`, error)
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  if (!uploadResponse.ok) {
    console.error(`${methodLogPrefix} File upload failed with status ${uploadResponse.status}: ${uploadResponseText}`)
    throw new Error(`File upload failed with status ${uploadResponse.status}: ${uploadResponseText}`)
  }
  
  let uploadData
  try {
    uploadData = JSON.parse(uploadResponseText)
    console.log(`${methodLogPrefix} Successfully parsed upload response JSON`)
  } catch (error) {
    console.error(`${methodLogPrefix} Invalid JSON in upload response:`, error)
    throw new Error(`Invalid JSON in upload response: ${error instanceof Error ? error.message : String(error)}. Response: ${uploadResponseText}`)
  }
  
  const { upload_url } = uploadData
  if (!upload_url) {
    console.error(`${methodLogPrefix} Upload URL not returned by AssemblyAI. Response: ${JSON.stringify(uploadData, null, 2)}`)
    throw new Error(`Upload URL not returned by AssemblyAI. Response: ${JSON.stringify(uploadData, null, 2)}`)
  }
  
  console.log(`${methodLogPrefix} Successfully obtained upload URL: ${upload_url}`)
  
  const transcriptionOptions = {
    audio_url: upload_url,
    speech_model: modelId as 'default' | 'nano'
  }
  
  console.log(`${methodLogPrefix} Requesting Assembly transcription with model ${modelId}`)
  let response
  let transcriptionResponseText
  
  try {
    response = await fetch(`https://api.assemblyai.com/v2/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionOptions)
    })
    
    console.log(`${methodLogPrefix} Received transcription request response with status: ${response.status}`)
    transcriptionResponseText = await response.text()
  } catch (error) {
    console.error(`${methodLogPrefix} Transcription request failed:`, error)
    throw new Error(`Transcription request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  if (!response.ok) {
    console.error(`${methodLogPrefix} HTTP error! status: ${response.status}, body: ${transcriptionResponseText}`)
    throw new Error(`HTTP error! status: ${response.status}, body: ${transcriptionResponseText}`)
  }
  
  let transcriptData
  try {
    transcriptData = JSON.parse(transcriptionResponseText)
    console.log(`${methodLogPrefix} Successfully parsed transcription request response JSON`)
  } catch (error) {
    console.error(`${methodLogPrefix} Invalid JSON in transcription request response:`, error)
    throw new Error(`Invalid JSON in transcription request response: ${error instanceof Error ? error.message : String(error)}. Response: ${transcriptionResponseText}`)
  }
  
  if (!transcriptData.id) {
    console.error(`${methodLogPrefix} No transcription ID returned by AssemblyAI. Response: ${JSON.stringify(transcriptData, null, 2)}`)
    throw new Error(`No transcription ID returned by AssemblyAI. Response: ${JSON.stringify(transcriptData, null, 2)}`)
  }
  
  console.log(`${methodLogPrefix} Polling for Assembly transcription results (ID: ${transcriptData.id})`)
  let transcript
  let pollingAttempts = 0
  const maxPollingAttempts = 60
  
  while (true) {
    pollingAttempts++
    console.log(`${methodLogPrefix} Polling attempt ${pollingAttempts}/${maxPollingAttempts}`)
    
    if (pollingAttempts > maxPollingAttempts) {
      console.error(`${methodLogPrefix} Transcription polling timed out after ${pollingAttempts} attempts`)
      throw new Error(`Transcription polling timed out after ${pollingAttempts} attempts`)
    }
    
    let pollingResponse
    let pollingResponseText
    
    try {
      pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, { headers })
      console.log(`${methodLogPrefix} Received polling response with status: ${pollingResponse.status}`)
      pollingResponseText = await pollingResponse.text()
    } catch (error) {
      console.error(`${methodLogPrefix} Polling failed:`, error)
      throw new Error(`Polling failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    if (!pollingResponse.ok) {
      console.error(`${methodLogPrefix} Polling failed with status ${pollingResponse.status}: ${pollingResponseText}`)
      throw new Error(`Polling failed with status ${pollingResponse.status}: ${pollingResponseText}`)
    }
    
    try {
      transcript = JSON.parse(pollingResponseText)
      console.log(`${methodLogPrefix} Successfully parsed polling response JSON, status: ${transcript.status}`)
    } catch (error) {
      console.error(`${methodLogPrefix} Invalid JSON in polling response:`, error)
      throw new Error(`Invalid JSON in polling response: ${error instanceof Error ? error.message : String(error)}. Response: ${pollingResponseText}`)
    }
    
    if (transcript.status === 'completed' || transcript.status === 'error') {
      console.log(`${methodLogPrefix} Polling completed with status: ${transcript.status}`)
      break
    }
    
    console.log(`${methodLogPrefix} Transcript not ready yet, waiting 3 seconds before next poll`)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  if (transcript.status === 'error' || transcript.error) {
    console.error(`${methodLogPrefix} Transcription failed: ${transcript.error || 'Unknown error'}`)
    throw new Error(`Transcription failed: ${transcript.error || 'Unknown error'}`)
  }
  
  console.log(`${methodLogPrefix} Assembly transcription completed successfully, fetching paragraphs`)
  let paragraphsResponse
  let paragraphsData
  
  try {
    paragraphsResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}/paragraphs`, { headers })
    console.log(`${methodLogPrefix} Received paragraphs response with status: ${paragraphsResponse.status}`)
    
    const paragraphsResponseText = await paragraphsResponse.text()
    
    if (!paragraphsResponse.ok) {
      console.error(`${methodLogPrefix} Paragraphs request failed with status ${paragraphsResponse.status}: ${paragraphsResponseText}`)
      throw new Error(`Paragraphs request failed with status ${paragraphsResponse.status}: ${paragraphsResponseText}`)
    }
    
    paragraphsData = JSON.parse(paragraphsResponseText)
    console.log(`${methodLogPrefix} Successfully parsed paragraphs response JSON, found ${paragraphsData.paragraphs.length} paragraphs`)
  } catch (error) {
    console.error(`${methodLogPrefix} Paragraphs request failed:`, error)
    throw new Error(`Paragraphs request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  console.log(`${methodLogPrefix} Formatting Assembly transcript`)
  const txtContent = formatAssemblyTranscript(paragraphsData.paragraphs)
  console.log(`${methodLogPrefix} Successfully formatted transcript, length: ${txtContent.length}`)
  
  return {
    transcript: txtContent,
    modelId,
    costPerMinuteCents
  }
}