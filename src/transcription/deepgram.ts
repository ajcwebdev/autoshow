// src/transcription/deepgram.ts

import { formatDeepgramTranscript } from './deepgram-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions } from '../utils/types.ts'

/**
 * Main function to handle transcription using Deepgram API.
 * If `options.speakerLabels` is true, diarization will be enabled and the returned transcript
 * will be formatted to include speaker labels. Otherwise, the transcript is returned as a
 * plain text string without speaker labeling.
 *
 * @param {ProcessingOptions} options - Additional processing options (e.g., speaker labels)
 * @param {string} finalPath - The base filename (without extension) for input/output files
 * @returns {Promise<TranscriptionResult>}
 * @throws {Error} If any step of the process fails (upload, transcription request, formatting)
 */
export async function callDeepgram(
  options: ProcessingOptions,
  finalPath: string
) {
  l.dim('\n  callDeepgram called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)

  if (!env['DEEPGRAM_API_KEY']) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  try {
    const defaultDeepgramModel = TRANSCRIPTION_SERVICES_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')?.modelId || 'nova-2'
    const deepgramModel = typeof options.deepgram === 'string'
      ? options.deepgram
      : defaultDeepgramModel

    const modelInfo =
      TRANSCRIPTION_SERVICES_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === deepgramModel.toLowerCase())
      || TRANSCRIPTION_SERVICES_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')

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