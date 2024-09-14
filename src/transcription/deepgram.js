// src/transcription/deepgram.js

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { createClient } from "@deepgram/sdk"

export async function callDeepgram(input, id) {
  const deepgram = createClient(env.DEEPGRAM_API_KEY)
  const isUrl = input.startsWith('http://') || input.startsWith('https://')
  try {
    const { result } = await deepgram.listen.prerecorded[isUrl ? 'transcribeUrl' : 'transcribeFile'](
      isUrl ? { url: input } : await readFile(input),
      { model: "nova-2", smart_format: true }
    )
    const formattedTranscript = result.results.channels[0].alternatives[0].paragraphs.paragraphs
      .flatMap(paragraph => paragraph.sentences)
      .map(sentence => {
        const minutes = Math.floor(sentence.start / 60).toString().padStart(2, '0')
        const seconds = Math.floor(sentence.start % 60).toString().padStart(2, '0')
        return `[${minutes}:${seconds}] ${sentence.text}`
      })
      .join('\n')
    await writeFile(`${id}.txt`, formattedTranscript)
    console.log('Transcript saved.')
  } catch (err) {
    console.error('Error processing the transcription:', err)
    throw err
  }
}