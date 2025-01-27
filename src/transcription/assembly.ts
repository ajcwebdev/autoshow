// src/transcription/assembly.ts

// This file manages transcription using the AssemblyAI API service.
// Steps involved:
// 1. Upload the local WAV audio file to AssemblyAI.
// 2. Request transcription of the uploaded file.
// 3. Poll for completion until the transcript is ready or fails.
// 4. Once completed, format the transcript using a helper function from transcription-utils.ts.
// 5. Return the formatted transcript.

import { readFile } from 'node:fs/promises'
import { env } from 'node:process'
import { l, err, logTranscriptionCost } from '../utils/logging'
import { formatAssemblyTranscript } from './format-transcript'
import { ASSEMBLY_MODELS } from '../utils/globals/transcription'
import type { ProcessingOptions } from '../utils/types/process'
import type {
  AssemblyAITranscriptionOptions,
  AssemblyAIErrorResponse,
  AssemblyAIUploadResponse,
  AssemblyAITranscript,
  AssemblyAIPollingResponse,
  AssemblyModelType
} from '../utils/types/transcription'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Main function to handle transcription using AssemblyAI.
 * @param options - Additional processing options (e.g., speaker labels)
 * @param finalPath - The base filename (without extension) for input/output files
 * @param model - The AssemblyAI model to use (default is 'NANO')
 * @returns Promise<string> - The formatted transcript content
 * @throws Error if any step of the process fails (upload, transcription request, polling, formatting)
 */
export async function callAssembly(
  options: ProcessingOptions,
  finalPath: string,
  model: string = 'NANO'
) {
  l.dim('\n  callAssembly called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)
  l.dim(`    - model: ${model}`)

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

    const modelInfo = ASSEMBLY_MODELS[model as AssemblyModelType] || ASSEMBLY_MODELS.NANO

    await logTranscriptionCost({
      modelName: modelInfo.name,
      costPerMinute: modelInfo.costPerMinute,
      filePath: audioFilePath
    })

    // Step 1: Uploading the audio file to AssemblyAI
    l.dim('\n  Uploading audio file to AssemblyAI...')
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
    l.dim('    - Audio file uploaded successfully.')

    // Step 2: Requesting the transcription
    const transcriptionOptions: AssemblyAITranscriptionOptions = {
      audio_url: upload_url,
      speech_model: modelInfo.modelId as 'default' | 'nano',
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

      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (transcript.status === 'error' || transcript.error) {
      throw new Error(`Transcription failed: ${transcript.error}`)
    }

    // Step 4: Formatting the transcript
    const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)
    return txtContent
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}