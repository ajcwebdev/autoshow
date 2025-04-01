// src/transcription/deepgram.ts

import { formatDeepgramTranscript } from './deepgram-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { getTranscriptionModelConfig } from '../utils/service-config.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function callDeepgram(
  options: ProcessingOptions,
  finalPath: string,
  modelId: string
) {
  l.dim('\n  callDeepgram called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)
  l.dim(`    - modelId: ${modelId}`)
  
  if (!env['DEEPGRAM_API_KEY']) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }
  
  try {
    // Get model configuration
    const modelConfig = getTranscriptionModelConfig('deepgram', modelId)
    if (!modelConfig) {
      throw new Error(`Model information for model ${modelId} is not defined.`)
    }
    
    const { costPerMinuteCents } = modelConfig
    
    // Set up API URL with parameters
    const apiUrl = new URL('https://api.deepgram.com/v1/listen')
    apiUrl.searchParams.append('model', modelId)
    apiUrl.searchParams.append('smart_format', 'true')
    apiUrl.searchParams.append('punctuate', 'true')
    apiUrl.searchParams.append('diarize', options.speakerLabels ? 'true' : 'false')
    apiUrl.searchParams.append('paragraphs', 'true')
    
    // Read the audio file and send to Deepgram
    const audioBuffer = await readFile(`${finalPath}.wav`)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env['DEEPGRAM_API_KEY']}`,
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
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}