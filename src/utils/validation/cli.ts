// src/utils/validate-cli.ts

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { exit } from 'node:process'
import { err } from '../logging'
import { processVideo } from '../../process-commands/video'
import { processPlaylist } from '../../process-commands/playlist'
import { processChannel } from '../../process-commands/channel'
import { processURLs } from '../../process-commands/urls'
import { processFile } from '../../process-commands/file'
import { processRSS } from '../../process-commands/rss'
import { LLM_OPTIONS } from '../../../shared/constants'
import { validateRSSAction } from '../command-utils/rss-utils'

import type { ProcessingOptions, ValidCLIAction, HandlerFunction } from '../types'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

export const envVarsMap = {
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY',
}

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
  action: ValidCLIAction
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
  const action = selectedAction as ValidCLIAction

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
  const llmKeys = LLM_OPTIONS as string[]
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
// Fix the validation logic for transcription services to ensure that the flag value is correctly passed.
export function validateTranscription(options: ProcessingOptions) {
  // Check if any transcription service is provided in the options
  if (options.deepgram) {
    return 'deepgram'
  } else if (options.assembly) {
    return 'assembly'
  } else if (options.whisper) {
    return 'whisper'
  }

  // If user didn’t specify any transcription flags, force a default to Whisper
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
  action: ValidCLIAction,
  options: ProcessingOptions,
  llmServices?: string,
  transcriptServices?: string
) {
  const handler = PROCESS_HANDLERS[action] as HandlerFunction

  // If user selected RSS, run specialized validation and logic
  if (action === 'rss') {
    await validateRSSAction(options, handler, llmServices, transcriptServices)
    return
  }

  // For other actions, ensure we have a valid input string
  const input = options[action]
  if (!input || typeof input !== 'string') {
    throw new Error(`No valid input provided for ${action} processing`)
  }

  // Execute the handler directly
  await handler(options, input, llmServices, transcriptServices)
}