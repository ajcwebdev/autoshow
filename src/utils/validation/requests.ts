// src/utils/validation/requests.ts

import { TRANSCRIPTION_SERVICES, LLM_SERVICES_CONFIG } from '../../../shared/constants'

import type { ProcessingOptions } from '../types'

/**
 * Maps server-side request body keys to corresponding environment variables.
 */
export const envVarsServerMap = {
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY'
}

/**
 * Validates the process type from the request body to ensure that it is a recognized
 * process type supported by the application. Throws an error if the type is invalid.
 *
 * @param type - The process type string from the request body
 * @returns The valid process type as a string if validation passes
 * @throws Error if the type is not valid or is missing
 */
export function validateServerProcessAction(type: string) {
  if (!['video', 'file', 'transcriptCost', 'llmCost', 'runLLM', 'createEmbeddings', 'queryEmbeddings'].includes(type)) {
    throw new Error('Invalid or missing process type')
  }
  return type
}

/**
 * Mapped return type for the validateRequest function, ensuring exactOptionalPropertyTypes usage.
 */
interface ValidateRequestReturn {
  options: ProcessingOptions
  llmServices?: string
  transcriptServices?: string
}

/**
 * Maps the incoming request data to typed processing options, determining which LLM
 * and transcription service (if any) to use. Returns an object with the `options`
 * plus optional `llmServices` and `transcriptServices` if they are defined.
 *
 * @param requestData - The raw request body
 * @returns An object containing processing options and optionally LLM or transcript service.
 */
export function validateRequest(requestData: any): ValidateRequestReturn {
  const options: ProcessingOptions = {}

  // Variables to hold selected services
  let llmServices: string | undefined
  let transcriptServices: string | undefined

  // Collect all valid LLM service values from LLM_SERVICES_CONFIG (excluding null/skip)
  const validLlmValues = Object.values(LLM_SERVICES_CONFIG)
    .map((service) => service.value)
    .filter((v) => v !== null)

  // Check if a valid LLM service is provided
  if (requestData.llm && validLlmValues.includes(requestData.llm)) {
    llmServices = requestData.llm
    if (llmServices) {
      options[llmServices] = requestData.llmModel || true
    }
  }

  const validTranscriptValues = TRANSCRIPTION_SERVICES.map(s => s.value)
  transcriptServices = validTranscriptValues.includes(requestData.transcriptServices)
    ? requestData.transcriptServices
    : 'whisper'

  if (transcriptServices === 'whisper') {
    const model = requestData.transcriptModel || requestData.whisperModel
    options.whisper = model || 'base'
  } else if (transcriptServices === 'deepgram') {
    const model = requestData.transcriptModel || requestData.deepgramModel
    options.deepgram = model || true
  } else if (transcriptServices === 'assembly') {
    const model = requestData.transcriptModel || requestData.assemblyModel
    options.assembly = model || true
  }

  // Map additional options from the request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      options[opt] = requestData[opt]
    }
  }

  // Build our return object conditionally for exactOptionalPropertyTypes:
  const result: ValidateRequestReturn = { options }

  if (llmServices !== undefined) {
    result.llmServices = llmServices
  }
  if (transcriptServices !== undefined) {
    result.transcriptServices = transcriptServices
  }

  return result
}

/**
 * Additional CLI flags or options that can be enabled.
 */
export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'saveAudio',
  'info',
  'walletAddress',
  'mnemonic'
]