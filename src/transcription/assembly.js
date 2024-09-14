// src/transcription/assembly.js

import { writeFile } from 'node:fs/promises'
import { AssemblyAI } from 'assemblyai'

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_API_KEY })

export async function callAssembly(input, id, useSpeakerLabels = false, speakersExpected = 1) {
  try {
    const transcript = await client.transcripts.transcribe({
      audio: input,
      speech_model: 'nano',
      ...(useSpeakerLabels && {
        speaker_labels: true,
        speakers_expected: Math.max(1, Math.min(speakersExpected, 25))
      })
    })
    let output = ''
    const formatTime = timestamp => {
      const totalSeconds = Math.floor(timestamp / 1000)
      return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`
    }
    if (transcript.utterances) {
      output = transcript.utterances.map(utt => 
        `${useSpeakerLabels ? `Speaker ${utt.speaker} ` : ''}(${formatTime(utt.start)}): ${utt.text}`
      ).join('\n')
    } else if (transcript.words) {
      let currentLine = ''
      let currentTimestamp = formatTime(transcript.words[0].start)
      transcript.words.forEach(word => {
        if (currentLine.length + word.text.length > 80) {
          output += `[${currentTimestamp}] ${currentLine.trim()}\n`
          currentLine = ''
          currentTimestamp = formatTime(word.start)
        }
        currentLine += `${word.text} `
      })
      if (currentLine.length > 0) {
        output += `[${currentTimestamp}] ${currentLine.trim()}\n`
      }
    } else {
      output = transcript.text || 'No transcription available.'
    }
    await writeFile(`${id}.txt`, output)
    console.log('Transcript saved.')
  } catch (error) {
    console.error('Error processing the transcription:', error)
  }
}