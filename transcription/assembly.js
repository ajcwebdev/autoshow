// transcription/assembly.js

import { AssemblyAI } from 'assemblyai'
import fs from 'fs'

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_API_KEY })

function formatTimestamp(timestamp) {
  let totalSeconds = Math.floor(timestamp / 1000)
  return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${Math.floor(totalSeconds % 60).toString().padStart(2, '0')}`
}

const runTranscription = async (audioInput, useSpeakerLabels = false, speakersExpected = 1) => {
  let transcriptionConfig = {
    audio: audioInput,
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
    } else {
      output = transcript.text ? transcript.text : 'No transcription available.'
    }

    fs.writeFileSync('assembly_transcript.md', output)
    console.log('Transcript saved.')
  } catch (error) {
    console.error('Error processing the transcription:', error)
  }
}

const audioInput = process.argv[2]
if (!audioInput) {
  console.error('No audio input provided. Please provide a file URL or local path.')
  process.exit(1)
}

const useSpeakerLabels = process.argv[3] === 'true'
const speakersExpected = parseInt(process.argv[4], 10) || 1

runTranscription(audioInput, useSpeakerLabels, speakersExpected)