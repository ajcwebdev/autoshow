// src/process-steps/03-run-transcription-utils.ts

import { l, err } from '../utils/logging.ts'
import { execPromise } from '../utils/node-utils.ts'
import { getTranscriptionModelConfig, validateTranscriptionService } from '../utils/service-config.ts'
import type { ProcessingOptions } from '../../shared/types.ts'
import type { TranscriptionServiceKey } from '../utils/service-config.ts'

export async function retryTranscriptionCall<T>(
  fn: () => Promise<T>
) {
  const maxRetries = 7
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      attempt++
      const result = await fn()
      l.dim(`  Transcription call completed successfully on attempt ${attempt}.`)
      return result
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting transcription.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('Transcription call failed after maximum retries.')
}

export async function logTranscriptionCost(info: {
  modelId: string
  costPerMinuteCents: number
  filePath: string
}) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const cost = info.costPerMinuteCents * minutes
  l.dim(
    `  - Estimated Transcription Cost for ${info.modelId}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: ¢${cost.toFixed(5)}`
  )
  return cost
}

export async function estimateTranscriptCost(
  options: ProcessingOptions,
  transcriptServices: string
) {
  const filePath = options.transcriptCost
  if (!filePath) throw new Error('No file path provided to estimate transcription cost.')
  
  if (!['whisper', 'deepgram', 'assembly'].includes(transcriptServices)) {
    throw new Error(`Unsupported transcription service: ${transcriptServices}`)
  }
  
  const service = transcriptServices as TranscriptionServiceKey
  
  // Validate the transcription service and model
  const { modelId, isValid } = validateTranscriptionService(options, service)
  
  if (!isValid) {
    throw new Error(`Invalid transcription configuration for ${service}`)
  }
  
  const modelConfig = getTranscriptionModelConfig(service, modelId)
  
  if (!modelConfig) {
    throw new Error(`Model not found for: ${modelId}`)
  }
  
  const cost = await logTranscriptionCost({
    modelId: modelConfig.modelId,
    costPerMinuteCents: modelConfig.costPerMinuteCents,
    filePath
  })
  
  return cost
}