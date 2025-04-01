// src/process-steps/03-run-transcription-utils.ts

import { l, err } from '../utils/logging.ts'
// import { execPromise } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'
import type { ProcessingOptions } from '../../shared/types.ts'
import { getAudioDurationInMinutes } from '../utils/cost-calculator.ts'

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
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('Transcription call failed after maximum retries.')
}

/**
 * Logs the approximate cost of transcription for the given model and file. 
 * Replaced inline cost logic with new cost-calculator approach.
 */
export async function logTranscriptionCost(info: {
  modelId: string
  costPerMinuteCents: number
  filePath: string
}) {
  try {
    const minutes = await getAudioDurationInMinutes(info.filePath)
    const cost = info.costPerMinuteCents * minutes
    l.dim(
      `  - Estimated Transcription Cost for ${info.modelId}:\n` +
      `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
      `    - Cost: ¢${cost.toFixed(5)}`
    )
    return cost
  } catch (error) {
    err(`Error in logTranscriptionCost: ${(error as Error).message}`)
    return 0
  }
}

/**
 * If the user just wants a transcript cost estimate (without actual transcription),
 * we used to have custom logic. Now we unify it with cost-calculator.ts functions.
 */
export async function estimateTranscriptCost(
  options: ProcessingOptions,
  transcriptServices: string
) {
  const filePath = options.transcriptCost
  if (!filePath) throw new Error('No file path provided to estimate transcription cost.')
  if (!['whisper', 'deepgram', 'assembly'].includes(transcriptServices)) {
    throw new Error(`Unsupported transcription service: ${transcriptServices}`)
  }

  const config = TRANSCRIPTION_SERVICES_CONFIG[transcriptServices as 'whisper' | 'deepgram' | 'assembly']
  const optionValue = options[transcriptServices as 'whisper' | 'deepgram' | 'assembly']
  const defaultModelId = transcriptServices === 'deepgram'
    ? 'nova-2'
    : transcriptServices === 'assembly'
      ? 'best'
      : 'base'
  const modelInput = typeof optionValue === 'string' ? optionValue : defaultModelId
  const normalizedModelId = modelInput.toLowerCase()
  const model = config.models.find(m => m.modelId === normalizedModelId)
  if (!model) throw new Error(`Model not found for: ${modelInput}`)

  try {
    const minutes = await getAudioDurationInMinutes(filePath)
    // Use the cost-per-minute from the config
    const cost = model.costPerMinuteCents * minutes
    l.dim(`\nTranscript cost estimate for ${transcriptServices} (${model.modelId}): ¢${cost.toFixed(5)}`)
    return cost
  } catch (error) {
    err(`Error in estimateTranscriptCost: ${(error as Error).message}`)
    throw error
  }
}
