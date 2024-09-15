// src/transcription/deepgram.js

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { createClient } from '@deepgram/sdk'

// Main function to handle transcription using Deepgram
export async function callDeepgram(input, id) {
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
      { model: "nova-2", smart_format: true }
    )

    // Process and format the transcription result
    const formattedTranscript = result.results.channels[0].alternatives[0].paragraphs.paragraphs
      .flatMap(paragraph => paragraph.sentences)
      .map(sentence => {
        // Format timestamp and text for each sentence
        const minutes = Math.floor(sentence.start / 60).toString().padStart(2, '0')
        const seconds = Math.floor(sentence.start % 60).toString().padStart(2, '0')
        return `[${minutes}:${seconds}] ${sentence.text}`
      })
      .join('\n')

    // Write the formatted transcript to a file
    await writeFile(`${id}.txt`, formattedTranscript)
    console.log('Transcript saved.')
  } catch (err) {
    // Log any errors that occur during the transcription process
    console.error('Error processing the transcription:', err)
    throw err  // Re-throw the error for handling in the calling function
  }
}