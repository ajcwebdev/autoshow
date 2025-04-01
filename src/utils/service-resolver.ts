/**
 * src/utils/service-resolver.ts
 *
 * This file centralizes service selection for both LLM and transcription, removing
 * repeated or one-off checks across multiple files.
 */

import { LLM_SERVICES_CONFIG, TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

/**
 * The result of resolving a service: it indicates which service key was chosen
 * (or undefined if not found), plus the raw value from the user's CLI options.
 */
export interface ResolvedService {
  /**
   * The standardized service identifier (e.g., 'chatgpt', 'whisper') or undefined
   * if no valid service was requested.
   */
  service: string | undefined

  /**
   * The raw model string requested by the user (e.g., 'gpt-4o-mini'), if any.
   */
  userModel?: string
}

/**
 * Resolves which LLM service (if any) was specified by the user in the CLI options.
 * This function consults LLM_SERVICES_CONFIG to determine if the user requested a
 * recognized service key (like --chatgpt), and returns that if present.
 */
export function resolveLLMService(options: ProcessingOptions): ResolvedService {
  const allLlmValues = Object.values(LLM_SERVICES_CONFIG)
    .map(service => service.value)
    .filter(v => v !== null) as string[]
  // Check which of these LLMs the user might have specified in options
  const chosenKey = allLlmValues.find(llmKey => !!options[llmKey])

  if (!chosenKey) {
    // No recognized LLM was specified
    return { service: undefined }
  }

  // See if user specified a model string (e.g. --chatgpt gpt-4o-mini)
  let userModel: string | undefined
  const rawUserValue = options[chosenKey]
  if (typeof rawUserValue === 'string' && rawUserValue !== 'true') {
    userModel = rawUserValue
  }

  return {
    service: chosenKey,
    userModel
  }
}

/**
 * Resolves which transcription service (if any) the user wants. If none are explicitly
 * specified, default to 'whisper'. This function removes scattered checks for
 * deepgram/assembly/whisper from other files.
 */
export function resolveTranscriptionService(options: ProcessingOptions): ResolvedService {
  const recognizedKeys = Object.values(TRANSCRIPTION_SERVICES_CONFIG)
    .map(cfg => cfg.value) // e.g., 'whisper', 'deepgram', 'assembly'
  const chosenKey = recognizedKeys.find(key => !!options[key])

  const finalKey = chosenKey ?? 'whisper'
  if (!options[finalKey]) {
    // If user didn't specify anything, default to whisper
    options.whisper = true
  }

  let userModel: string | undefined
  const rawUserValue = options[finalKey]
  if (typeof rawUserValue === 'string' && rawUserValue !== 'true') {
    userModel = rawUserValue
  }

  return {
    service: finalKey,
    userModel
  }
}
