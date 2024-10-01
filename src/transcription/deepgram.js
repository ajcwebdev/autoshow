// src/transcription/deepgram.js

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { createClient } from '@deepgram/sdk'

/**
 * Main function to handle transcription using Deepgram.
 * @param {string} input - The URL or local file path of the audio to transcribe.
 * @param {string} id - The identifier used for naming output files.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callDeepgram(input, id) {
  // Check if the DEEPGRAM_API_KEY environment variable is set
  if (!env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set.')
  }

  // Initialize the Deepgram client with the API key from environment variables
  const deepgram = createClient(env.DEEPGRAM_API_KEY)

  // Check if the input is a URL or a local file
  const isUrl = input.startsWith('http://') || input.startsWith('https://')

  try {
    // Request transcription from Deepgram
    const { result } = await deepgram.listen.prerecorded[isUrl ? 'transcribeUrl' : 'transcribeFile'](
      // Use URL or file content based on input type
      isUrl ? { url: input } : await readFile(input),
      // Use the "nova-2" model with smart formatting
      { model: 'nova-2', smart_format: true }
    )

    // Process and format the transcription result
    const formattedTranscript = result.results.channels[0].alternatives[0].paragraphs.paragraphs
      .flatMap((paragraph) => paragraph.sentences)
      .map((sentence) => {
        // Format timestamp and text for each sentence
        const minutes = Math.floor(sentence.start / 60).toString().padStart(2, '0')
        const seconds = Math.floor(sentence.start % 60).toString().padStart(2, '0')
        return `[${minutes}:${seconds}] ${sentence.text}`
      })
      .join('\n')

    // Write the formatted transcript to a file
    await writeFile(`${id}.txt`, formattedTranscript)
    console.log(`\nTranscript saved:\n  - ${id}.txt`)
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error('Error processing the transcription:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}