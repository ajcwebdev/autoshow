// src/transcription/deepgram.js

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { createClient } from "@deepgram/sdk"

const formatTimestamp = (timestamp) => {
  const minutes = Math.floor(timestamp / 60).toString().padStart(2, '0')
  const seconds = Math.floor(timestamp % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export async function callDeepgram(input, id) {
  const deepgram = createClient(env.DEEPGRAM_API_KEY)
  const options = { model: "nova-2", smart_format: true }
  const method = input.startsWith('http://') || input.startsWith('https://') ? 'transcribeUrl' : 'transcribeFile'
  const source = method === 'transcribeUrl' ? { url: input } : await readFile(input)
  try {
    const { result } = await deepgram.listen.prerecorded[method](source, options)
    const formattedTranscript = result.results.channels[0].alternatives[0].paragraphs.paragraphs
      .flatMap(paragraph => paragraph.sentences)
      .map(sentence => `[${formatTimestamp(sentence.start)}] ${sentence.text}`)
      .join('\n')
    await writeFile(`${id}.txt`, formattedTranscript)
    console.log('Transcript saved.')
  } catch (err) {
    console.error('Error processing the transcription:', err)
    throw err
  }
}