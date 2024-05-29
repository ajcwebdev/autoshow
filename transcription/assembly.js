// transcription/assembly.js

import { AssemblyAI } from 'assemblyai'
import fs from 'fs'

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_API_KEY })

function formatTimestamp(timestamp) {
  let totalSeconds = Math.floor(timestamp / 1000)
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${Math.floor(totalSeconds % 60).toString().padStart(2, '0')}`
}

export const transcribe = async (input, id, useSpeakerLabels = false, speakersExpected = 1) => {
  let transcriptionConfig = {
    audio: input,
    speech_model: 'nano'
  }

  if (useSpeakerLabels) {
    transcriptionConfig.speaker_labels = true
    transcriptionConfig.speakers_expected = Math.max(1, Math.min(speakersExpected, 25))
  }

  try {
    const transcript = await client.transcripts.transcribe(transcriptionConfig)
    let output = ''

    if (transcript.utterances) {
      transcript.utterances.forEach(utt => {
        const speakerPrefix = useSpeakerLabels ? `Speaker ${utt.speaker} ` : ''
        output += `${speakerPrefix}(${formatTimestamp(utt.start)}): ${utt.text}\n`
      })
    } else if (transcript.words) {
      let currentLine = ''
      let currentTimestamp = formatTimestamp(transcript.words[0].start)

      transcript.words.forEach(word => {
        if (currentLine.length + word.text.length > 80) { // Arbitrary length to break lines
          output += `[${currentTimestamp}] ${currentLine.trim()}\n`
          currentLine = ''
          currentTimestamp = formatTimestamp(word.start)
        }
        currentLine += `${word.text} `
      })

      if (currentLine.length > 0) {
        output += `[${currentTimestamp}] ${currentLine.trim()}\n`
      }
    } else {
      output = transcript.text ? transcript.text : 'No transcription available.'
    }

    await fs.promises.writeFile(`${id}.txt`, output)
    console.log('Transcript saved.')
  } catch (error) {
    console.error('Error processing the transcription:', error)
  }
}