// server/utils/reqToOpts.ts

import { ProcessingOptions, LLMServices, TranscriptServices } from '../../../src/types.js'

// Function to map request data to processing options
export function reqToOpts(requestData: any): {
  options: ProcessingOptions
  llmServices?: LLMServices
  transcriptServices?: TranscriptServices
} {
  // Define lists of supported options
  const llmOptions = [
    'chatgpt',
    'claude',
    'cohere',
    'mistral',
    'ollama',
    'gemini',
    'fireworks',
    'together',
    'groq',
  ] as const

  const transcriptOptions = [
    'whisper',
    'whisperDocker',
    'whisperPython',
    'whisperDiarization',
    'deepgram',
    'assembly',
  ] as const

  const otherOptions = ['speakerLabels', 'prompt', 'noCleanUp', 'order', 'skip', 'info', 'item']

  // Initialize options object
  const options: ProcessingOptions = {}

  // Variables to hold selected services
  let llmServices: LLMServices | undefined
  let transcriptServices: TranscriptServices | undefined

  // Check if a valid LLM service is provided
  if (requestData.llm && llmOptions.includes(requestData.llm)) {
    // Set the LLM service
    llmServices = requestData.llm as LLMServices
    // Set the LLM model or default to true
    options[llmServices] = requestData.llmModel || true
  }

  // Determine transcript service or default to 'whisper' if not specified
  transcriptServices = transcriptOptions.includes(requestData.transcriptServices)
    ? (requestData.transcriptServices as TranscriptServices)
    : 'whisper'

  // Set transcript options based on the selected service
  if (transcriptServices === 'whisper') {
    // Set the Whisper model or default to 'base'
    options.whisper = requestData.whisperModel || 'base'
  } else if (transcriptServices === 'whisperDocker') {
    options.whisperDocker = requestData.whisperModel || 'base'
  } else if (transcriptServices === 'whisperPython') {
    options.whisperPython = requestData.whisperModel || 'base'
  } else if (transcriptServices === 'whisperDiarization') {
    options.whisperDiarization = requestData.whisperModel || 'base'
  } else if (transcriptServices === 'deepgram') {
    options.deepgram = true
  } else if (transcriptServices === 'assembly') {
    options.assembly = true
  }

  // Map additional options from the request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      // Set the option if it is provided
      options[opt] = requestData[opt]
    }
  }

  // Return the mapped options along with selected services
  return { options, llmServices, transcriptServices }
}
