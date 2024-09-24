// src/transcription/assembly.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { AssemblyAI } from 'assemblyai'

// Initialize the AssemblyAI client with API key from environment variables
const client = new AssemblyAI({ apiKey: env.ASSEMBLY_API_KEY })

/**
 * Main function to handle transcription using AssemblyAI.
 * @param {string} input - The audio file path or URL to transcribe.
 * @param {string} id - The identifier used for naming output files.
 * @param {boolean} [useSpeakerLabels=false] - Whether to use speaker labels.
 * @param {number} [speakersExpected=1] - The expected number of speakers.
 * @returns {Promise<void>}
 */
export async function callAssembly(input, id, useSpeakerLabels = false, speakersExpected = 1) {
  try {
    // Request transcription from AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: input,                                                     // The audio file to transcribe
      speech_model: 'nano',                                             // Use the 'nano' speech model for transcription
      ...(useSpeakerLabels && {                                         // Conditionally add speaker labeling options
        speaker_labels: true,
        speakers_expected: Math.max(1, Math.min(speakersExpected, 25))  // Ensure speakers are between 1 and 25
      })
    })

    // Initialize output string
    let output = ''

    // Helper function to format timestamps
    const formatTime = timestamp => {
      const totalSeconds = Math.floor(timestamp / 1000)
      return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`
    }

    // Process the transcript based on whether utterances are available
    if (transcript.utterances) {
      // If utterances are available, format each utterance with speaker labels if used
      output = transcript.utterances.map(utt => 
        `${useSpeakerLabels ? `Speaker ${utt.speaker} ` : ''}(${formatTime(utt.start)}): ${utt.text}`
      ).join('\n')
    } else if (transcript.words) {
      // If only words are available, group them into lines with timestamps
      let currentLine = ''
      let currentTimestamp = formatTime(transcript.words[0].start)
      transcript.words.forEach(word => {
        if (currentLine.length + word.text.length > 80) {
          // Start a new line if the current line exceeds 80 characters
          output += `[${currentTimestamp}] ${currentLine.trim()}\n`
          currentLine = ''
          currentTimestamp = formatTime(word.start)
        }
        currentLine += `${word.text} `
      })
      // Add the last line if there's any remaining text
      if (currentLine.length > 0) {
        output += `[${currentTimestamp}] ${currentLine.trim()}\n`
      }
    } else {
      // If no structured data is available, use the plain text or a default message
      output = transcript.text || 'No transcription available.'
    }

    // Write the formatted transcript to a file
    await writeFile(`${id}.txt`, output)
    console.log('Transcript saved.')
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error('Error processing the transcription:', error)
  }
}