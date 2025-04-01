// src/commander-utils.ts

import { processVideo } from './process-commands/video.ts'
import { processPlaylist } from './process-commands/playlist.ts'
import { processChannel } from './process-commands/channel.ts'
import { processURLs } from './process-commands/urls.ts'
import { processFile } from './process-commands/file.ts'
import { processRSS } from './process-commands/rss.ts'
import { validateRSSAction } from './process-commands/rss-utils.ts'
import { estimateTranscriptCost } from './process-steps/03-run-transcription-utils.ts'
import { selectPrompts } from './process-steps/04-select-prompt.ts'
import { estimateLLMCost, runLLMFromPromptFile } from './process-steps/05-run-llm-utils.ts'
import { createEmbeds } from './utils/embeddings/create-embed.ts'
import { queryEmbeddings } from './utils/embeddings/query-embed.ts'
import { err } from './utils/logging.ts'
import { exit } from './utils/node-utils.ts'
import { 
  getLLMServiceFromOptions, 
  getTranscriptionServiceFromOptions,
  validateLLMService,
  validateTranscriptionService
} from './utils/service-config.ts'
import type { ProcessingOptions, HandlerFunction } from '../shared/types.ts'

export const PROCESS_HANDLERS = {
  video: processVideo,
  playlist: processPlaylist,
  channel: processChannel,
  urls: processURLs,
  file: processFile,
  rss: processRSS,
}

export const ACTION_OPTIONS = [
  {
    name: 'video',
    description: 'Single YouTube Video',
    message: 'Enter the YouTube video URL:',
    validate: (input: string) => input ? true : 'Please enter a valid URL.',
  },
  {
    name: 'playlist',
    description: 'YouTube Playlist',
    message: 'Enter the YouTube playlist URL:',
    validate: (input: string) => input ? true : 'Please enter a valid URL.',
  },
  {
    name: 'channel',
    description: 'YouTube Channel',
    message: 'Enter the YouTube channel URL:',
    validate: (input: string) => input ? true : 'Please enter a valid URL.',
  },
  {
    name: 'urls',
    description: 'List of URLs from File',
    message: 'Enter the file path containing URLs:',
    validate: (input: string) => input ? true : 'Please enter a valid file path.',
  },
  {
    name: 'file',
    description: 'Local Audio/Video File',
    message: 'Enter the local audio/video file path:',
    validate: (input: string) => input ? true : 'Please enter a valid file path.',
  },
  {
    name: 'rss',
    description: 'Podcast RSS Feed',
    message: 'Enter the podcast RSS feed URL:',
    validate: (input: string) => input ? true : 'Please enter a valid URL.',
  },
]

export function validateOption(
  optionKeys: string[],
  options: ProcessingOptions,
  errorMessage: string
) {
  const selectedOptions = optionKeys.filter((opt) => {
    const value = options[opt as keyof ProcessingOptions]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value !== undefined && value !== null && value !== false
  })
  if (selectedOptions.length > 1) {
    err(`Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`)
    exit(1)
  }
  return selectedOptions[0] as string | undefined
}

export function validateInputCLI(options: ProcessingOptions): {
  action: 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'
  llmServices: string | undefined
  transcriptServices: string | undefined
} {
  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  const selectedAction = validateOption(actionValues, options, 'input option')
  if (!selectedAction || !(selectedAction in PROCESS_HANDLERS)) {
    err(`Invalid or missing action`)
    exit(1)
  }
  const action = selectedAction as 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'
  const llmServices = validateLLM(options)
  const transcriptServices = validateTranscription(options)
  return { action, llmServices, transcriptServices }
}

export function validateLLM(options: ProcessingOptions) {
  // Get the requested LLM service from options
  const llmService = getLLMServiceFromOptions(options)
  if (!llmService) {
    return undefined
  }
  
  // Validate the selected service and model
  const { isValid, service } = validateLLMService(options, llmService)
  if (!isValid || !service) {
    return undefined
  }
  
  return service
}

export function validateTranscription(options: ProcessingOptions) {
  // Get the requested transcription service from options
  const transcriptionService = getTranscriptionServiceFromOptions(options)
  
  // Validate the selected service and model
  const { isValid, service } = validateTranscriptionService(options, transcriptionService)
  if (!isValid || !service) {
    // Default to whisper if validation failed
    options.whisper = true
    return 'whisper'
  }
  
  return service
}

export async function processAction(
  action: 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss',
  options: ProcessingOptions,
  llmServices?: string,
  transcriptServices?: string
) {
  const handler = PROCESS_HANDLERS[action] as HandlerFunction
  if (action === 'rss') {
    await validateRSSAction(options, handler, llmServices, transcriptServices)
    return
  }
  const input = options[action]
  if (!input || typeof input !== 'string') {
    throw new Error(`No valid input provided for ${action} processing`)
  }
  await handler(options, input, llmServices, transcriptServices)
}

export async function handleEarlyExitIfNeeded(options: ProcessingOptions): Promise<void> {
  if (options.printPrompt) {
    const prompt = await selectPrompts({ printPrompt: options.printPrompt })
    console.log(prompt)
    exit(0)
  }
  
  const cliDirectory = options['directory']
  if (options['createEmbeddings']) {
    try {
      await createEmbeds(cliDirectory)
      console.log('Embeddings created successfully.')
    } catch (error) {
      err(`Error creating embeddings: ${(error as Error).message}`)
      exit(1)
    }
    exit(0)
  }
  
  if (options['queryEmbeddings']) {
    const question = options['queryEmbeddings']
    try {
      await queryEmbeddings(question, cliDirectory)
    } catch (error) {
      err(`Error querying embeddings: ${(error as Error).message}`)
      exit(1)
    }
    exit(0)
  }
  
  if (options.transcriptCost) {
    const transcriptServices = validateTranscription(options)
    if (!transcriptServices) {
      err('Please specify which transcription service to use (e.g., --deepgram, --assembly, --whisper).')
      exit(1)
    }
    await estimateTranscriptCost(options, transcriptServices)
    exit(0)
  }
  
  if (options.llmCost) {
    const llmService = validateLLM(options)
    if (!llmService) {
      err('Please specify which LLM service to use (e.g., --chatgpt, --claude, etc.).')
      exit(1)
    }
    await estimateLLMCost(options, llmService)
    exit(0)
  }
  
  if (options.runLLM) {
    const llmService = validateLLM(options)
    if (!llmService) {
      err('Please specify which LLM service to use (e.g., --chatgpt, --claude, etc.).')
      exit(1)
    }
    await runLLMFromPromptFile(options.runLLM, options, llmService)
    exit(0)
  }
}