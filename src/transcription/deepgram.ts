// src/transcription/deepgram.ts

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, wait, err } from '../globals.js'
import type { ProcessingOptions, DeepgramResponse } from '../types.js'

/**
 * Main function to handle transcription using Deepgram API.
 * @param {ProcessingOptions} options - Additional processing options.
 * @param {string} finalPath - The identifier used for naming output files.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callDeepgram(options: ProcessingOptions, finalPath: string): Promise<string> {
  l(wait('\n  Using Deepgram for transcription...\n'))
  // l(`Options received in callDeepgram:\n`)
  // l(options)
  // l(`finalPath:`, finalPath)

  // Check if the DEEPGRAM_API_KEY environment variable is set
  if (!env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  try {
    const apiUrl = new URL('https://api.deepgram.com/v1/listen')

    // Set query parameters
    apiUrl.searchParams.append('model', 'nova-2')
    apiUrl.searchParams.append('smart_format', 'true')
    apiUrl.searchParams.append('punctuate', 'true')
    apiUrl.searchParams.append('diarize', 'false')
    apiUrl.searchParams.append('paragraphs', 'true')

    // Read the local WAV file
    const audioBuffer = await readFile(`${finalPath}.wav`)

    // Send the request to Deepgram
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/wav'
      },
      body: audioBuffer
    })

    if (!response.ok) {
      throw new Error(`Deepgram API request failed with status ${response.status}`)
    }

    const result = await response.json() as DeepgramResponse

    // Extract the words array from the Deepgram API response
    const txtContent = result.results.channels[0].alternatives[0].words
      // Use reduce to iterate over the words array and build the formatted transcript
      .reduce((acc, { word, start }, i, arr) => {
        // Determine if a timestamp should be added
        // Add timestamp if it's the first word, every 30th word, or the start of a sentence
        const timestamp = (i % 30 === 0 || word.match(/^[A-Z]/))
          // If true, create a timestamp string that calculates minutes/seconds and converts to string with a pad for leading zeros
          ? `[${Math.floor(start / 60).toString().padStart(2, '0')
            }:${Math.floor(start % 60).toString().padStart(2, '0')}] `
          // If false, use an empty string (no timestamp)
          : ''
    
        // Add newline if the word ends a sentence, every 30th word, or it's the last word
        const newline = (word.match(/[.!?]$/) || i % 30 === 29 || i === arr.length - 1)
          // Add a newline character if true and use an empty string if false
          ? '\n'
          : ''
    
        // Combine the accumulated text, timestamp (if any), current word, and newline (if any)
        return `${acc}${timestamp}${word} ${newline}`
      }, '')

    // Write the formatted transcript to a file
    await writeFile(`${finalPath}.txt`, txtContent)
    l(wait(`\n  Transcript saved:\n    - ${finalPath}.txt\n`))

    // Create an empty LRC file to prevent cleanup errors
    await writeFile(`${finalPath}.lrc`, '')
    l(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))

    return txtContent
  } catch (error) {
    // Log any errors that occur during the transcription process
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}