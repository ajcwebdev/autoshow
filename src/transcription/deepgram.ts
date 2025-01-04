// src/transcription/deepgram.ts

// This file manages transcription using the Deepgram API service.
// Steps:
// 1. Read the local WAV file.
// 2. Send it to Deepgram for transcription with chosen parameters (model, formatting, punctuation, etc.).
// 3. Check for successful response and extract the transcription results.
// 4. Format the returned words array using formatDeepgramTranscript to add timestamps and newlines.
// 5. Return the formatted transcript.

import { readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, err } from '../utils/logging'
import { formatDeepgramTranscript } from '../utils/format-transcript'
import type { ProcessingOptions } from '../types/process'
import type { DeepgramResponse } from '../types/transcription'

/**
 * Main function to handle transcription using Deepgram API.
 * @param options - Additional processing options (e.g., speaker labels)
 * @param finalPath - The base filename (without extension) for input/output files
 * @returns Promise<string> - The formatted transcript content
 * @throws Error if any step of the process fails (upload, transcription request, formatting)
 */
export async function callDeepgram(
  options: ProcessingOptions,
  finalPath: string
): Promise<string> {
  l.wait('\n  Using Deepgram for transcription...\n')
  l.wait(`\n  Options:\n\n${JSON.stringify(options)}`)

  if (!env['DEEPGRAM_API_KEY']) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  try {
    const apiUrl = new URL('https://api.deepgram.com/v1/listen')

    // Set query parameters for the chosen model and formatting
    apiUrl.searchParams.append('model', 'nova-2')
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

    const result = await response.json() as DeepgramResponse

    // Extract the transcription results
    // Deepgram returns results in channels->alternatives->words
    const channel = result.results?.channels?.[0]
    const alternative = channel?.alternatives?.[0]

    if (!alternative?.words) {
      throw new Error('No transcription results found in Deepgram response')
    }

    // Format the returned words array
    const txtContent = formatDeepgramTranscript(alternative.words)
    return txtContent
  } catch (error) {
    // If any error occurred at any step, log it and rethrow
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}