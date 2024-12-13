// src/transcription/assembly.ts

// This file manages transcription using the AssemblyAI API service.
// Steps involved:
// 1. Upload the local WAV audio file to AssemblyAI.
// 2. Request transcription of the uploaded file.
// 3. Poll for completion until the transcript is ready or fails.
// 4. Once completed, format the transcript using a helper function from transcription-utils.ts.
// 5. Save the final formatted transcript to a .txt file and also create an empty .lrc file as required by the pipeline.

import { writeFile, readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, wait, success, err } from '../utils/logging'
import { formatAssemblyTranscript } from './transcription-utils'
import type { ProcessingOptions } from '../types/main'
import type {
  AssemblyAITranscriptionOptions,
  AssemblyAIErrorResponse,
  AssemblyAIUploadResponse,
  AssemblyAITranscript,
  AssemblyAIPollingResponse
} from '../types/transcript-service-types'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Main function to handle transcription using AssemblyAI.
 * @param options - Additional processing options (e.g., speaker labels)
 * @param finalPath - The base filename (without extension) for input/output files
 * @returns Promise<string> - The formatted transcript content
 * @throws Error if any step of the process fails (upload, transcription request, polling, formatting)
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

    // Step 1: Uploading the audio file to AssemblyAI
    l(wait('\n  Uploading audio file to AssemblyAI...'))
    const fileBuffer = await readFile(audioFilePath)

    const uploadResponse = await fetch(`${BASE_URL}/upload`, {
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

    // Step 2: Requesting the transcription
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

    // Step 3: Polling for transcription completion
    let transcript: AssemblyAIPollingResponse
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
      transcript = await pollingResponse.json() as AssemblyAIPollingResponse

      if (transcript.status === 'completed' || transcript.status === 'error') {
        break
      }

      // Wait 3 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (transcript.status === 'error' || transcript.error) {
      throw new Error(`Transcription failed: ${transcript.error}`)
    }

    // Step 4: Formatting the transcript
    // The formatAssemblyTranscript function handles all formatting logic including speaker labels and timestamps.
    const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)

    // Step 5: Write the formatted transcript to a .txt file
    await writeFile(`${finalPath}.txt`, txtContent)
    l(wait(`\n  Transcript saved...\n  - ${finalPath}.txt\n`))

    // Create an empty LRC file to satisfy pipeline expectations (even if we don't use it for this service)
    await writeFile(`${finalPath}.lrc`, '')
    l(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))

    return txtContent
  } catch (error) {
    // If any error occurred at any step, log it and rethrow
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}