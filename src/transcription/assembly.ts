import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import fetch from 'node-fetch'
import { log, wait, success } from '../models.js'
import type { ProcessingOptions } from '../types.js'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Main function to handle transcription using AssemblyAI.
 * @param {ProcessingOptions} options - Additional processing options.
 * @param {string} finalPath - The identifier used for naming output files.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callAssembly(options: ProcessingOptions, finalPath: string): Promise<string> {
  log(wait('\n  Using AssemblyAI for transcription...'))
  // Check if the ASSEMBLY_API_KEY environment variable is set
  if (!env.ASSEMBLY_API_KEY) {
    throw new Error('ASSEMBLY_API_KEY environment variable is not set. Please set it to your AssemblyAI API key.')
  }

  const headers = {
    'Authorization': env.ASSEMBLY_API_KEY,
    'Content-Type': 'application/json'
  }

  try {
    const { speakerLabels } = options
    const audioFilePath = `${finalPath}.wav`

    // Step 1: Upload the audio file
    log(wait('\n  Uploading audio file to AssemblyAI...'))
    const uploadUrl = `${BASE_URL}/upload`
    const fileStream = createReadStream(audioFilePath)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': env.ASSEMBLY_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(`File upload failed: ${errorData.error || uploadResponse.statusText}`)
    }

    const uploadData = await uploadResponse.json()
    const upload_url: string = uploadData.upload_url
    if (!upload_url) {
      throw new Error('Upload URL not returned by AssemblyAI.')
    }
    log(success('  Audio file uploaded successfully.'))

    // Step 2: Request transcription
    const response = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audio_url: upload_url,
        speech_model: 'nano',
        speaker_labels: speakerLabels || false
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const transcriptData = await response.json()

    // Step 3: Poll for completion
    let transcript
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
      transcript = await pollingResponse.json()

      if (transcript.status === 'completed' || transcript.status === 'error') {
        break
      }

      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (transcript.status === 'error') {
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
    if (transcript.utterances) {
      // If utterances are available, format each with speaker labels if used
      txtContent = transcript.utterances.map((utt: any) =>
        `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${formatTime(utt.start)}): ${utt.text}`
      ).join('\n')
    } else if (transcript.words) {
      // If only words are available, group them into lines with timestamps
      let currentLine = ''
      let currentTimestamp = formatTime(transcript.words[0].start)
      transcript.words.forEach((word: any) => {
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
    log(wait(`\n  Transcript saved...\n  - ${finalPath}.txt\n`))

    // Create an empty LRC file to prevent cleanup errors
    await writeFile(`${finalPath}.lrc`, '')
    log(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))

    return txtContent
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error(`Error processing the transcription: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}