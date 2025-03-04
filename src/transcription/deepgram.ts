// src/transcription/deepgram.ts

import { readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, err } from '../utils/logging'
import { logTranscriptionCost, formatDeepgramTranscript } from '../process-steps/03-run-transcription-utils'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants'
import type { ProcessingOptions } from '../utils/types'

/**
 * Main function to handle transcription using Deepgram API.
 * @param {ProcessingOptions} options - Additional processing options (e.g., speaker labels)
 * @param {string} finalPath - The base filename (without extension) for input/output files
 * @param {string} [model] - The Deepgram model to use (default is 'NOVA_2')
 * @returns {Promise<string>} - The formatted transcript content
 * @throws {Error} If any step of the process fails (upload, transcription request, formatting)
 */
export async function callDeepgram(
  _options: ProcessingOptions,
  finalPath: string,
  model: string = 'Nova-2'
) {
  l.dim('\n  callDeepgram called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)
  l.dim(`    - model: ${model}`)

  if (!env['DEEPGRAM_API_KEY']) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  try {
    const modelInfo =
    TRANSCRIPTION_SERVICES_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === model.toLowerCase())
      || TRANSCRIPTION_SERVICES_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')

    if (!modelInfo) {
      throw new Error(`Model information for model ${model} is not defined.`)
    }

    const { name, costPerMinute } = modelInfo

    await logTranscriptionCost({
      modelName: name,
      costPerMinute,
      filePath: `${finalPath}.wav`
    })

    const apiUrl = new URL('https://api.deepgram.com/v1/listen')

    // Set query parameters for the chosen model and formatting
    apiUrl.searchParams.append('model', modelInfo.modelId)
    apiUrl.searchParams.append('smart_format', 'true')
    apiUrl.searchParams.append('punctuate', 'true')
    apiUrl.searchParams.append('diarize', 'false')
    apiUrl.searchParams.append('paragraphs', 'true')

    // Read the WAV file from disk
    const audioBuffer = await readFile(`${finalPath}.wav`)

    // Send the WAV data to Deepgram for transcription
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

    // Extract the transcription results, Deepgram returns results in channels->alternatives->words
    const channel = result.results?.channels?.[0]
    const alternative = channel?.alternatives?.[0]

    if (!alternative?.words) {
      throw new Error('No transcription results found in Deepgram response')
    }

    // Format the returned words array
    const txtContent = formatDeepgramTranscript(alternative.words)
    return txtContent
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}