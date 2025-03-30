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
import { LLM_SERVICES_CONFIG } from '../shared/constants.ts'

import type { ProcessingOptions, HandlerFunction } from './utils/types.ts'

/**
 * Maps action names to their corresponding handler function.
 */
export const PROCESS_HANDLERS = {
  video: processVideo,
  playlist: processPlaylist,
  channel: processChannel,
  urls: processURLs,
  file: processFile,
  rss: processRSS,
}

/**
 * Action options for content processing. Maps available actions to descriptions, validation messages, and input validation.
 */
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

/**
 * Helper function to validate that only one option from a list is provided.
 * Prevents users from specifying multiple conflicting options simultaneously.
 * 
 * @param optionKeys - The list of option keys to check.
 * @param options - The options object.
 * @param errorMessage - The prefix of the error message.
 * @returns The selected option or undefined.
 */
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

/**
 * Combines the validation logic for action, LLM, and transcription selection from the CLI options.
 *
 * @param options - The command-line options provided by the user
 * @returns An object containing the validated `action`, `llmServices`, and `transcriptServices`
 * @throws An error (and exits) if the action is invalid or missing
 */
export function validateInputCLI(options: ProcessingOptions): {
  action: 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'
  llmServices: string | undefined
  transcriptServices: string | undefined
} {
  // Validate which action was chosen
  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  const selectedAction = validateOption(actionValues, options, 'input option')
  if (!selectedAction || !(selectedAction in PROCESS_HANDLERS)) {
    err(`Invalid or missing action`)
    exit(1)
  }
  const action = selectedAction as 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'

  // Validate LLM
  const llmServices = validateLLM(options)

  // Validate transcription
  const transcriptServices = validateTranscription(options)

  return { action, llmServices, transcriptServices }
}

/**
 * Validates the LLM services chosen by the user.
 *
 * @param options - The command-line options provided by the user
 * @returns The validated LLM service
 * @throws An error if the LLM service is invalid or not provided
 */
export function validateLLM(options: ProcessingOptions) {
  // Collect all service values (excluding null) from LLM_SERVICES_CONFIG
  const llmKeys = Object.values(LLM_SERVICES_CONFIG)
    .map((service) => service.value)
    .filter((v) => v !== null) as string[]

  const llmKey = validateOption(llmKeys, options, 'LLM option')
  if (!llmKey) {
    return undefined
  }
  return llmKey
}

/**
 * Validates the transcription services chosen by the user.
 *
 * @param options - The command-line options provided by the user
 * @returns The validated transcription service
 * @throws An error if the transcription service is invalid or not provided
 */
export function validateTranscription(options: ProcessingOptions) {
  if (options.deepgram) {
    return 'deepgram'
  } else if (options.assembly) {
    return 'assembly'
  } else if (options.whisper) {
    return 'whisper'
  }
  options.whisper = true
  return 'whisper'
}

/**
 * Routes the specified action to the appropriate handler or validation logic.
 *
 * @param action - The validated action user wants to run (e.g., "video", "rss", etc.)
 * @param options - The ProcessingOptions containing user inputs and flags
 * @param llmServices - The optional LLM service for processing
 * @param transcriptServices - The optional transcription service
 * @returns Promise<void> Resolves or rejects based on processing outcome
 * @throws {Error} If the action is invalid or the required input is missing
 */
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

/**
 * Checks for early exit flags (printPrompt, transcriptCost, llmCost, runLLM, createEmbeddings, queryEmbeddings)
 * and handles them if present, exiting the process after completion.
 *
 * @param options - The command-line options provided by the user
 * @returns Promise<void> Resolves if no early exit flag is triggered, otherwise exits the process
 */
export async function handleEarlyExitIfNeeded(options: ProcessingOptions): Promise<void> {
  // If the user just wants to print prompts, do that and exit
  if (options.printPrompt) {
    const prompt = await selectPrompts({ printPrompt: options.printPrompt })
    console.log(prompt)
    exit(0)
  }

  const cliDirectory = options['directory']

  // If the user wants to create embeddings, do that and exit
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

  // If the user wants to query embeddings, do that and exit
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

  // Handle transcript cost estimation
  if (options.transcriptCost) {
    const transcriptServices = validateTranscription(options)

    if (!transcriptServices) {
      err('Please specify which transcription service to use (e.g., --deepgram, --assembly, --whisper).')
      exit(1)
    }

    await estimateTranscriptCost(options, transcriptServices)
    exit(0)
  }

  // Handle LLM cost estimation
  if (options.llmCost) {
    const llmService = validateLLM(options)

    if (!llmService) {
      err('Please specify which LLM service to use (e.g., --chatgpt, --claude, etc.).')
      exit(1)
    }

    await estimateLLMCost(options, llmService)
    exit(0)
  }

  // Handle running Step 5 (LLM) directly with a prompt file
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