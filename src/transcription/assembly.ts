// src/transcription/assembly.ts

import { formatAssemblyTranscript } from './assembly-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'
import { checkTranscriptionApiKey } from '../utils/transcription-service-utils.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

const BASE_URL = 'https://api.assemblyai.com/v2'

export async function callAssembly(
  options: ProcessingOptions,
  finalPath: string
) {
  l.dim('\n  callAssembly called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)

  checkTranscriptionApiKey('assembly')

  // Must ensure we have a string for headers:
  const apiKey = env['ASSEMBLY_API_KEY'] || ''
  const headers: Record<string, string> = {
    Authorization: apiKey,
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
    const fileBuffer = await readFile(audioFilePath)

    // 1) upload
    const uploadResponse = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/octet-stream'
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

    // 2) request transcription
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

    // 3) poll
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

    const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)
    return {
      transcript: txtContent,
      modelId,
      costPerMinuteCents
    }
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    err(`Error processing the transcription: ${e.message}`)
    throw e
  }
}
