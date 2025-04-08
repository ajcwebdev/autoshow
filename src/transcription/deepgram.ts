// src/transcription/deepgram.ts

import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { T_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions } from '../../shared/types.ts'

/**
 * Represents a single word object in the Deepgram transcription response,
 * which may include speaker labels when diarization is enabled.
 */
export interface DeepgramWord {
  /**
   * The transcribed word
   */
  word: string

  /**
   * The start timestamp (in seconds) of the word in the audio
   */
  start: number

  /**
   * The end timestamp (in seconds) of the word in the audio
   */
  end: number

  /**
   * The confidence score (0.0 - 1.0) for the recognized word
   */
  confidence: number

  /**
   * The speaker number assigned to this word (e.g., 0, 1, 2)
   * Only provided if diarization (speaker labels) is enabled
   */
  speaker?: number

  /**
   * The confidence score for the assigned speaker (pre-recorded only)
   */
  speaker_confidence?: number
}

/**
 * Formats the Deepgram transcript by either merging all words into a single text string
 * or, if speaker labels are enabled, grouping the transcription by speaker.
 *
 * @param {DeepgramWord[]} words - The array of word objects returned from the Deepgram API
 * @param {boolean} speakerLabels - Whether to include speaker labeling
 * @returns {string} - The formatted transcript, with or without speaker labels
 */
export function formatDeepgramTranscript(
  words: DeepgramWord[],
  speakerLabels: boolean
): string {
  // If no speaker labels requested, return a plain text transcript
  if (!speakerLabels) {
    return words.map(w => w.word).join(' ')
  }

  // Otherwise, group words by speaker
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

  // Add the final speaker block
  if (speakerWords.length > 0) {
    transcript += `Speaker ${currentSpeaker}: ${speakerWords.join(' ')}`
  }

  return transcript
}

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