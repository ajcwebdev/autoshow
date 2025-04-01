// src/transcription/assembly.ts

import { formatAssemblyTranscript } from './assembly-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { getTranscriptionModelConfig } from '../utils/service-config.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

const BASE_URL = 'https://api.assemblyai.com/v2'

export async function callAssembly(
  options: ProcessingOptions,
  finalPath: string,
  modelId: string
) {
  l.dim('\n  callAssembly called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)
  l.dim(`    - modelId: ${modelId}`)
  
  if (!env['ASSEMBLY_API_KEY']) {
    throw new Error('ASSEMBLY_API_KEY environment variable is not set. Please set it to your AssemblyAI API key.')
  }
  
  const headers = {
    'Authorization': env['ASSEMBLY_API_KEY'],
    'Content-Type': 'application/json'
  }
  
  try {
    const { speakerLabels } = options
    const audioFilePath = `${finalPath}.wav`
    
    // Get model configuration
    const modelConfig = getTranscriptionModelConfig('assembly', modelId)
    if (!modelConfig) {
      throw new Error(`Model information for model ${modelId} is not available.`)
    }
    
    const { costPerMinuteCents } = modelConfig
    
    // Upload the file to AssemblyAI
    const fileBuffer = await readFile(audioFilePath)
    const uploadResponse = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': env['ASSEMBLY_API_KEY'],
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
    
    // Request transcription
    const transcriptionOptions = {
      audio_url: upload_url,
      speech_model: modelId === 'best' ? 'default' : modelId as 'default' | 'nano',
      speaker_labels: speakerLabels || false
    }
    
    const response = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionOptions)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const transcriptData = await response.json()
    
    // Poll for transcription completion
    let transcript
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
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
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}