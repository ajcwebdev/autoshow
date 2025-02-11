// src/utils/validate-option.ts

import { LLM_OPTIONS } from './step-utils/llm-utils'
import { TRANSCRIPTION_SERVICES } from '../../shared/constants'
import { XMLParser } from 'fast-xml-parser'

import type { TranscriptServices } from './types/transcription'
import type { LLMServices } from './types/llms'
import type { ProcessingOptions, ValidAction } from './types/step-types'

/**
 * Validates the process type from the request body to ensure that it is a recognized
 * process type supported by the application. Throws an error if the type is invalid.
 *
 * @param type - The process type string from the request body
 * @returns The valid process type as a `ValidAction` if validation passes
 * @throws Error if the type is not valid or is missing
 */
export function validateServerProcessAction(type: string) {
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

  const validTranscriptValues = TRANSCRIPTION_SERVICES.map(s => s.value)
  transcriptServices = validTranscriptValues.includes(requestData.transcriptServices)
    ? (requestData.transcriptServices as TranscriptServices)
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
  'info',
]

/**
 * Configure XML parser for RSS feed processing.
 * Handles attributes without prefixes and allows boolean values.
 *
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})