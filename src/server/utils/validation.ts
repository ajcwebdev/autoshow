

import { LLM_OPTIONS } from '../../utils/llm-utils'
import { TRANSCRIPT_OPTIONS } from '../../utils/transcription-utils'

import type { ProcessingOptions, ValidAction } from '../../utils/types/process'
import type { TranscriptServices } from '../../utils/types/transcription'
import type { LLMServices } from '../../utils/types/llms'

/**
 * Validates the process type from the request body to ensure that it is a recognized
 * process type supported by the application. Throws an error if the type is invalid.
 *
 * @param type - The process type string from the request body
 * @returns The valid process type as a `ValidAction` if validation passes
 * @throws Error if the type is not valid or is missing
 */
export function validateServerProcessAction(type: string): ValidAction {
  if (!['video', 'urls', 'rss', 'playlist', 'file', 'channel'].includes(type)) {
    throw new Error('Invalid or missing process type')
  }
  return type as ValidAction
}

// Function to map request data to processing options
export function validateRequest(requestData: any): {
  options: ProcessingOptions
  llmServices?: LLMServices
  transcriptServices?: TranscriptServices
} {
  // Initialize options object
  const options: ProcessingOptions = {}

  // Variables to hold selected services
  let llmServices: LLMServices | undefined
  let transcriptServices: TranscriptServices | undefined

  // Check if a valid LLM service is provided
  if (requestData.llm && LLM_OPTIONS.includes(requestData.llm)) {
    // Set the LLM service
    llmServices = requestData.llm as LLMServices
    // Set the LLM model or default to true
    options[llmServices] = requestData.llmModel || true
  }

  // Determine transcript service or default to 'whisper' if not specified
  transcriptServices = TRANSCRIPT_OPTIONS.includes(requestData.transcriptServices)
    ? (requestData.transcriptServices as TranscriptServices)
    : 'whisper'

  // Set transcript options based on the selected service
  if (transcriptServices === 'whisper') {
    // Set the Whisper model or default to 'large-v3-turbo'
    options.whisper = requestData.whisperModel || 'large-v3-turbo'
  } else if (transcriptServices === 'deepgram') {
    options.deepgram = true
  } else if (transcriptServices === 'assembly') {
    options.assembly = true
  }

  // Map additional options from the request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      // Set the option if it is provided
      // @ts-ignore
      options[opt] = requestData[opt]
    }
  }

  // Return the mapped options along with selected services
  // @ts-ignore
  return { options, llmServices, transcriptServices }
}

/**
 * Additional CLI flags or options that can be enabled.
 * 
 */
export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'saveAudio',
  'order',
  'skip',
  'info',
  'item',
]