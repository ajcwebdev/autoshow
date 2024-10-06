// src/transcription/deepgram.ts

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { createClient, SyncPrerecordedResponse, DeepgramResponse } from '@deepgram/sdk'
import { log, wait } from '../types.js'
import type { ProcessingOptions } from '../types.js'

/**
 * Main function to handle transcription using Deepgram.
 * @param {string} finalPath - The identifier used for naming output files.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callDeepgram(options: ProcessingOptions, finalPath: string): Promise<string> {
  // Check if the DEEPGRAM_API_KEY environment variable is set
  if (!env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  // Initialize the Deepgram client with the API key from environment variables
  const deepgram = createClient(env.DEEPGRAM_API_KEY)

  // Check if the input is a URL or a local file
  const isUrl = finalPath.startsWith('http://') || finalPath.startsWith('https://')

  try {
    let result: DeepgramResponse<SyncPrerecordedResponse>
    if (isUrl) {
      // Use transcribeUrl for URL inputs
      result = await deepgram.listen.prerecorded.transcribeUrl(
        { url: finalPath },
        { model: 'nova-2', smart_format: true }
      )
    } else {
      // Use transcribeFile for local file inputs
      const audioBuffer = await readFile(`${finalPath}.wav`)
      result = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        { model: 'nova-2', smart_format: true }
      )
    }

    // Type guard: Check if the result has 'results' and 'metadata' (success case)
    if ('results' in result && 'metadata' in result) {
      // Safely cast the result to SyncPrerecordedResponse after the check
      const successResult = result as unknown as SyncPrerecordedResponse

      // Safely access properties with optional chaining
      const txtContent = successResult.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs
        ?.flatMap((paragraph) => paragraph.sentences)
        ?.map((sentence) => {
          // Handle case where sentence or start might be undefined
          const minutes = Math.floor((sentence.start ?? 0) / 60).toString().padStart(2, '0')
          const seconds = Math.floor((sentence.start ?? 0) % 60).toString().padStart(2, '0')
          return `[${minutes}:${seconds}] ${sentence.text ?? ''}`
        })
        ?.join('\n') || '' // Default to empty string if undefined

      // Write the formatted transcript to a file
      await writeFile(`${finalPath}.txt`, txtContent)
      log(wait(`\n  Transcript saved:\n    - ${finalPath}.txt\n`))
      return txtContent
    } else {
      throw new Error('Deepgram returned an error response or incomplete data')
    }
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error(`Error processing the transcription: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}