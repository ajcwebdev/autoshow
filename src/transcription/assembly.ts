// src/transcription/assembly.ts

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, wait, success, err } from '../globals.js'
import type { ProcessingOptions } from '../types.js'
import type {
  AssemblyAITranscriptionOptions,
  AssemblyAIErrorResponse,
  AssemblyAIUploadResponse,
  AssemblyAITranscript,
  AssemblyAIPollingResponse,
  AssemblyAIUtterance,
  AssemblyAIWord
} from '../types.js'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Main function to handle transcription using AssemblyAI.
 * @param {ProcessingOptions} options - Additional processing options.
 * @param {string} finalPath - The identifier used for naming output files.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callAssembly(options: ProcessingOptions, finalPath: string): Promise<string> {
  l(wait('\n  Using AssemblyAI for transcription...'))
  
  if (!env['ASSEMBLY_API_KEY']) {
    throw new Error('ASSEMBLY_API_KEY environment variable is not set. Please set it to your AssemblyAI API key.')
  }

  const headers = {
    'Authorization': env['ASSEMBLY_API_KEY'],
    'Content-Type': 'application/json'
  }

  try {
    const { speakerLabels } = options
    const audioFilePath = `${finalPath}.wav`

    // Step 1: Upload the audio file
    l(wait('\n  Uploading audio file to AssemblyAI...'))
    const uploadUrl = `${BASE_URL}/upload`
    const fileBuffer = await readFile(audioFilePath)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': env['ASSEMBLY_API_KEY'],
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json() as AssemblyAIErrorResponse
      throw new Error(`File upload failed: ${errorData.error || uploadResponse.statusText}`)
    }

    const uploadData = await uploadResponse.json() as AssemblyAIUploadResponse
    const { upload_url } = uploadData
    if (!upload_url) {
      throw new Error('Upload URL not returned by AssemblyAI.')
    }
    l(success('  Audio file uploaded successfully.'))

    // Step 2: Request transcription
    const transcriptionOptions: AssemblyAITranscriptionOptions = {
      audio_url: upload_url,
      speech_model: 'nano',
      speaker_labels: speakerLabels || false
    }

    const response = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionOptions)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const transcriptData = await response.json() as AssemblyAITranscript

    // Step 3: Poll for completion
    let transcript: AssemblyAIPollingResponse
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
      transcript = await pollingResponse.json() as AssemblyAIPollingResponse

      if (transcript.status === 'completed' || transcript.status === 'error') {
        break
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (transcript.status === 'error' || transcript.error) {
      throw new Error(`Transcription failed: ${transcript.error}`)
    }

    // Initialize output string
    let txtContent = ''

    // Helper function to format timestamps
    const formatTime = (timestamp: number): string => {
      const totalSeconds = Math.floor(timestamp / 1000)
      return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`
    }

    // Process the transcript based on whether utterances are available
    if (transcript.utterances && transcript.utterances.length > 0) {
      // If utterances are available, format each with speaker labels if used
      txtContent = transcript.utterances.map((utt: AssemblyAIUtterance) =>
        `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${formatTime(utt.start)}): ${utt.text}`
      ).join('\n')
    } else if (transcript.words && transcript.words.length > 0) {
      // Check if words array exists and has content
      const firstWord = transcript.words[0]
      if (!firstWord) {
        throw new Error('No words found in transcript')
      }

      // If only words are available, group them into lines with timestamps
      let currentLine = ''
      let currentTimestamp = formatTime(firstWord.start)
      
      transcript.words.forEach((word: AssemblyAIWord) => {
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
    l(wait(`\n  Transcript saved...\n  - ${finalPath}.txt\n`))

    // Create an empty LRC file to prevent cleanup errors
    await writeFile(`${finalPath}.lrc`, '')
    l(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))

    return txtContent
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}