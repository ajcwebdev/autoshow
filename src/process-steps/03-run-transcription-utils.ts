// src/process-steps/03-run-transcription-utils.ts

import { l, err } from '../utils/logging.ts'
import { execPromise } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions } from '../../shared/types.ts'

/**
 * Retries a given transcription call with an exponential backoff of 7 attempts (1s initial delay).
 * 
 * @param {() => Promise<T>} fn - The function to execute for the transcription call
 * @returns {Promise<T>} Resolves when the function succeeds or rejects after 7 attempts
 * @throws {Error} If the function fails after all attempts
 */
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
 * Asynchronously calculates and logs the estimated transcription cost, then returns that cost value.
 * Internally calculates the audio file duration using ffprobe.
 *
 * @param {object} info - An object containing transcription information
 * @param {string} info.modelId - The model identifier (e.g., 'base', 'nova-2', etc.)
 * @param {number} info.costPerMinuteCents - The cost per minute in cents
 * @param {string} info.filePath - The file path to the audio file
 * @returns {Promise<number>} The numeric transcription cost
 * @throws {Error} If ffprobe fails or returns invalid data.
 */
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

/**
 * Estimates transcription cost for the provided file and chosen transcription service.
 * 
 * @param {ProcessingOptions} options - The command-line options (must include `transcriptCost` file path).
 * @param {string} transcriptServices - The selected transcription service (e.g., "deepgram", "assembly", "whisper").
 * @returns {Promise<number>} The numeric cost estimate
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

  const cost = await logTranscriptionCost({
    modelId: model.modelId,
    costPerMinuteCents: model.costPerMinuteCents,
    filePath
  })

  return cost
}