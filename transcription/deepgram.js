// transcription/deepgram.js

import { createClient } from "@deepgram/sdk"
import fs from 'fs'

const formatTimestamp = (timestamp) => {
  const minutes = Math.floor(timestamp / 60).toString().padStart(2, '0')
  const seconds = Math.floor(timestamp % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

const transcribe = async (input) => {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY)
  const options = { model: "nova-2", smart_format: true }
  const method = input.startsWith('http://') || input.startsWith('https://') ? 'transcribeUrl' : 'transcribeFile'
  const source = method === 'transcribeUrl' ? { url: input } : fs.readFileSync(input)

  try {
    const { result, error } = await deepgram.listen.prerecorded[method](source, options)
    if (error) throw error

    const formattedTranscript = result.results.channels[0].alternatives[0].paragraphs.paragraphs
      .flatMap(paragraph => paragraph.sentences)
      .map(sentence => `[${formatTimestamp(sentence.start)}] ${sentence.text}`)
      .join('\n')

    await fs.promises.writeFile('content/deepgram_transcript.md', formattedTranscript)
    await fs.promises.writeFile('content/deepgram_output.json', JSON.stringify(result, null, 2))
    console.log('Transcript and full output saved.')
  } catch (err) {
    console.error('Error processing the transcription:', err)
  }
}

const input = process.argv[2]
if (!input) {
  console.error('No input provided. Please provide a file path or URL.')
  process.exit(1)
}

transcribe(input)