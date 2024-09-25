// src/transcription/assembly.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { AssemblyAI } from 'assemblyai'

// Initialize the AssemblyAI client with API key from environment variables
const client = new AssemblyAI({ apiKey: env.ASSEMBLY_API_KEY })

/**
 * Main function to handle transcription using AssemblyAI.
 * @param {string} finalPath - The identifier used for naming output files.
 * @param {string} transcriptOpt - The transcription service to use.
 * @param {object} options - Additional options for processing.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 */
export async function callAssembly(finalPath, transcriptOpt, options) {
  try {
    const { speakerLabels } = options
    console.log(`Parameters passed to callAssembly:`)
    console.log(`  - finalPath: ${finalPath}\n  - transcriptOpt: ${transcriptOpt}\n  - speakerLabels: ${speakerLabels}`)
    // Request transcription from AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: `${finalPath}.wav`,  // The audio file to transcribe
      speech_model: 'nano',       // Use the 'nano' speech model for transcription
      ...(speakerLabels && {      // Conditionally add speaker labeling options
        speaker_labels: true,
      })
    })

    // Initialize output string
    let txtContent = ''

    // Helper function to format timestamps
    const formatTime = timestamp => {
      const totalSeconds = Math.floor(timestamp / 1000)
      return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`
    }

    // Process the transcript based on whether utterances are available
    if (transcript.utterances) {
      // If utterances are available, format each utterance with speaker labels if used
      txtContent = transcript.utterances.map(utt => 
        `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${formatTime(utt.start)}): ${utt.text}`
      ).join('\n')
    } else if (transcript.words) {
      // If only words are available, group them into lines with timestamps
      let currentLine = ''
      let currentTimestamp = formatTime(transcript.words[0].start)
      transcript.words.forEach(word => {
        if (currentLine.length + word.text.length > 80) {
          // Start a new line if the current line exceeds 80 characters
          txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
          currentLine = ''
          currentTimestamp = formatTime(word.start)
        }
        currentLine += `${word.text} `
      })
      // Add the last line if there's any remaining text
      if (currentLine.length > 0) {
        txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
      }
    } else {
      // If no structured data is available, use the plain text or a default message
      txtContent = transcript.text || 'No transcription available.'
    }

    // Write the formatted transcript to a file
    await writeFile(`${finalPath}.txt`, txtContent)
    console.log(`\nTranscript saved:\n  - ${finalPath}.txt`)
    return txtContent
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error('Error processing the transcription:', error)
  }
}