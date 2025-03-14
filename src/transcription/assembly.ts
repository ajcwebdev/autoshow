// src/transcription/assembly.ts

import { logTranscriptionCost } from '../process-steps/03-run-transcription-utils'
import { formatAssemblyTranscript } from './assembly-utils'
import { l, err } from '../utils/logging'
import { readFile, env } from '../utils/node-utils'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants'

import type { ProcessingOptions } from '../utils/types'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Main function to handle transcription using AssemblyAI.
 * @param options - Additional processing options (e.g., speaker labels)
 * @param finalPath - The base filename (without extension) for input/output files
 * @returns Promise<string> - The formatted transcript content
 * @throws Error if any step of the process fails (upload, transcription request, polling, formatting)
 */
export async function callAssembly(
  options: ProcessingOptions,
  finalPath: string
) {
  l.dim('\n  callAssembly called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)

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

    const defaultAssemblyModel = TRANSCRIPTION_SERVICES_CONFIG.assembly.models.find(m => m.modelId === 'best')?.modelId || 'best'
    const assemblyModel = typeof options.assembly === 'string'
      ? options.assembly
      : defaultAssemblyModel

    const modelInfo = 
      TRANSCRIPTION_SERVICES_CONFIG.assembly.models.find(m => m.modelId.toLowerCase() === assemblyModel.toLowerCase())
      || TRANSCRIPTION_SERVICES_CONFIG.assembly.models.find(m => m.modelId === 'best')

    if (!modelInfo) {
      throw new Error(`Model information for model ${assemblyModel} is not available.`)
    }

    const { modelId, costPerMinuteCents } = modelInfo

    await logTranscriptionCost({
      modelId,
      costPerMinuteCents,
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
      const errorData = await uploadResponse.json()
      throw new Error(`File upload failed: ${errorData.error || uploadResponse.statusText}`)
    }

    const uploadData = await uploadResponse.json()
    const { upload_url } = uploadData
    if (!upload_url) {
      throw new Error('Upload URL not returned by AssemblyAI.')
    }
    l.dim('    - Audio file uploaded successfully.')

    // Step 2: Requesting the transcription
    const transcriptionOptions = {
      audio_url: upload_url,
      speech_model: modelId as 'default' | 'nano',
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

    const transcriptData = await response.json()

    // Step 3: Polling for transcription completion
    let transcript
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
      transcript = await pollingResponse.json()

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