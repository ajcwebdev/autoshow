// src/utils/validate-option.ts

import { exit } from 'node:process'
import { spawn } from 'node:child_process'
import { processVideo } from '../process-commands/video'
import { processPlaylist } from '../process-commands/playlist'
import { processChannel } from '../process-commands/channel'
import { processURLs } from '../process-commands/urls'
import { processFile } from '../process-commands/file'
import { processRSS } from '../process-commands/rss'
import { l, err } from '../utils/logging'
import { ACTION_OPTIONS, LLM_OPTIONS, TRANSCRIPT_OPTIONS, otherOptions } from '../utils/globals'
import type { ProcessingOptions, ValidAction, HandlerFunction, ProcessRequestBody } from '../types/process'
import type { TranscriptServices } from '../types/transcription'
import type { LLMServices, OllamaTagsResponse } from '../types/llms'

/**
 * checkServerAndModel()
 * ---------------------
 * Checks if the Ollama server is running, attempts to start it if not running,
 * and ensures that the specified model is available. If not, it will pull the model.
 *
 * @param {string} ollamaHost - The Ollama host
 * @param {string} ollamaPort - The Ollama port
 * @param {string} ollamaModelName - The Ollama model name
 * @returns {Promise<void>}
 */
export async function checkServerAndModel(
  ollamaHost: string,
  ollamaPort: string,
  ollamaModelName: string
): Promise<void> {
  async function checkServer(): Promise<boolean> {
    try {
      const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
      return serverResponse.ok
    } catch (error) {
      return false
    }
  }

  if (await checkServer()) {
    l.wait('\n  Ollama server is already running...')
  } else {
    if (ollamaHost === 'ollama') {
      throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
    } else {
      l.wait('\n  Ollama server is not running. Attempting to start...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      ollamaProcess.unref()

      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.wait('    - Ollama server is now ready.')
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
      if (attempts === 30) {
        throw new Error('Ollama server failed to become ready in time.')
      }
    }
  }

  l.wait(`\n  Checking if model is available: ${ollamaModelName}`)
  try {
    const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
    if (!tagsResponse.ok) {
      throw new Error(`HTTP error! status: ${tagsResponse.status}`)
    }
    const tagsData = (await tagsResponse.json()) as OllamaTagsResponse
    const isModelAvailable = tagsData.models.some((m) => m.name === ollamaModelName)

    if (!isModelAvailable) {
      l.wait(`\n  Model ${ollamaModelName} is not available, pulling...`)
      const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaModelName }),
      })
      if (!pullResponse.ok) {
        throw new Error(`Failed to initiate pull for model ${ollamaModelName}`)
      }
      if (!pullResponse.body) {
        throw new Error('Response body is null')
      }

      const reader = pullResponse.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.trim() === '') continue
          try {
            const parsedLine = JSON.parse(line)
            if (parsedLine.status === 'success') {
              l.wait(`    - Model ${ollamaModelName} pulled successfully.\n`)
              break
            }
          } catch (parseError) {
            err(`Error parsing JSON while pulling model: ${parseError}`)
          }
        }
      }
    } else {
      l.wait(`\n  Model ${ollamaModelName} is already available.\n`)
    }
  } catch (error) {
    err(`Error checking/pulling model: ${(error as Error).message}`)
    throw error
  }
}

// Map each action to its corresponding handler function
export const PROCESS_HANDLERS: Record<ValidAction, HandlerFunction> = {
  video: processVideo,
  playlist: processPlaylist,
  channel: processChannel,
  urls: processURLs,
  file: processFile,
  rss: processRSS,
}

/**
 * Type guard to check if a string is a valid action.
 *
 * @param action - The action name to check.
 * @returns True if the given action is one of the valid actions, false otherwise.
 */
export function isValidAction(action: string | undefined): action is ValidAction {
  return Boolean(action && action in PROCESS_HANDLERS)
}

// Type guard to check if a string is a valid process type
export function isValidProcessType(type: string): type is ProcessRequestBody['type'] {
  return ['video', 'urls', 'rss', 'playlist', 'file', 'channel'].includes(type)
}

/**
 * Validates the action the user wants to run by checking their provided options.
 * 
 * @param options - The ProcessingOptions containing user inputs and flags
 * @returns The valid action to perform
 */
export function validateAction(options: ProcessingOptions): ValidAction {
  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  const selectedAction = validateOption(actionValues, options, 'input option')
  if (!selectedAction || !isValidAction(selectedAction)) {
    err(`Invalid or missing action`)
    exit(1)
  }
  return selectedAction
}

/**
 * Validates which LLM service was chosen by the user.
 * 
 * @param options - The ProcessingOptions containing user inputs
 * @returns The chosen LLM service, or undefined if none was chosen
 */
export function validateLLM(options: ProcessingOptions): LLMServices | undefined {
  const llmKey = validateOption(LLM_OPTIONS as string[], options, 'LLM option') as LLMServices | undefined
  return llmKey
}

/**
 * Validates which transcription service was chosen by the user.
 * Also sets a default Whisper model if whisper is selected but no model specified.
 * 
 * @param options - The ProcessingOptions containing user inputs
 * @returns The chosen transcription service
 */
export function validateTranscription(options: ProcessingOptions): TranscriptServices {
  const transcriptKey = validateOption(TRANSCRIPT_OPTIONS, options, 'transcription option')
  const transcriptServices: TranscriptServices = (transcriptKey as TranscriptServices) || 'whisper'

  if (transcriptServices === 'whisper' && !options.whisper) {
    options.whisper = 'large-v3-turbo'
  }

  return transcriptServices
}

/**
 * Centralized function for processing any action. If the action is 'rss',
 * then we perform RSS-specific validation & processing. Otherwise, we get
 * the relevant handler and run it on the user input.
 *
 * @param action - The validated action user wants to run ('video', 'rss', etc.)
 * @param options - The ProcessingOptions containing user inputs and flags
 * @param llmServices - The optional LLM service for processing
 * @param transcriptServices - The optional transcription service
 */
export async function processAction(
  action: ValidAction,
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Look up the correct handler function for our action
  const handler = PROCESS_HANDLERS[action]

  // If the user selected RSS, we do specialized validation and run the RSS logic.
  if (action === 'rss') {
    // This calls your existing function that normalizes/validates RSS options
    // and then processes each RSS feed URL by calling `handler(...)`.
    await validateRSSAction(options, handler, llmServices, transcriptServices)
    return
  }

  // For non-RSS actions, just ensure we have a valid input string
  const input = options[action]
  if (!input || typeof input !== 'string') {
    throw new Error(`No valid input provided for ${action} processing`)
  }

  // Run the handler with the provided input
  await handler(options, input, llmServices, transcriptServices)
}

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
): string | undefined {
  // Filter out which options from the provided list are actually set
  const selectedOptions = optionKeys.filter((opt) => {
    const value = options[opt as keyof ProcessingOptions]
    if (Array.isArray(value)) {
      // For array options like 'rss', consider it provided only if the array is non-empty
      return value.length > 0
    }
    // Exclude undefined, null, and false values
    return value !== undefined && value !== null && value !== false
  })

  // If more than one option is selected, throw an error
  if (selectedOptions.length > 1) {
    err(
      `Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`
    )
    exit(1)
  }
  return selectedOptions[0] as string | undefined
}

/**
 * Normalizes RSS-related options so that `options.rss` and `options.item` are always arrays.
 * This ensures consistent types for further validation or processing.
 * 
 * @param options - The processing options object.
 */
function normalizeRSSOptions(options: ProcessingOptions): void {
  // Ensure options.item is always an array if provided via command line
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }

  // Ensure options.rss is always an array, in case it's a single string
  if (typeof options.rss === 'string') {
    options.rss = [options.rss]
  }
}

/**
 * Validates RSS processing options for consistency and correct values.
 * 
 * @param options - Configuration options to validate.
 * @throws Will exit the process if validation fails.
 */
export function validateRSSOptions(options: ProcessingOptions): void {
  if (options.last !== undefined) {
    if (!Number.isInteger(options.last) || options.last < 1) {
      err('Error: The --last option must be a positive integer.')
      process.exit(1)
    }
    if (options.skip !== undefined || options.order !== undefined) {
      err('Error: The --last option cannot be used with --skip or --order.')
      process.exit(1)
    }
  }

  if (options.skip !== undefined && (!Number.isInteger(options.skip) || options.skip < 0)) {
    err('Error: The --skip option must be a non-negative integer.')
    process.exit(1)
  }

  if (options.order !== undefined && !['newest', 'oldest'].includes(options.order)) {
    err("Error: The --order option must be either 'newest' or 'oldest'.")
    process.exit(1)
  }

  if (options.lastDays !== undefined) {
    if (!Number.isInteger(options.lastDays) || options.lastDays < 1) {
      err('Error: The --lastDays option must be a positive integer.')
      process.exit(1)
    }
    if (
      options.last !== undefined ||
      options.skip !== undefined ||
      options.order !== undefined ||
      (options.date && options.date.length > 0)
    ) {
      err('Error: The --lastDays option cannot be used with --last, --skip, --order, or --date.')
      process.exit(1)
    }
  }

  if (options.date && options.date.length > 0) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    for (const d of options.date) {
      if (!dateRegex.test(d)) {
        err(`Error: Invalid date format "${d}". Please use YYYY-MM-DD format.`)
        process.exit(1)
      }
    }

    if (
      options.last !== undefined ||
      options.skip !== undefined ||
      options.order !== undefined
    ) {
      err('Error: The --date option cannot be used with --last, --skip, or --order.')
      process.exit(1)
    }
  }
}

/**
 * Validates channel processing options for consistency and correct values.
 * 
 * @param options - Configuration options to validate.
 * @throws Will exit the process if validation fails.
 */
export function validateChannelOptions(options: ProcessingOptions): void {
  if (options.last !== undefined) {
    if (!Number.isInteger(options.last) || options.last < 1) {
      err('Error: The --last option must be a positive integer.')
      process.exit(1)
    }
    if (options.skip !== undefined || options.order !== undefined) {
      err('Error: The --last option cannot be used with --skip or --order.')
      process.exit(1)
    }
  }

  if (options.skip !== undefined && (!Number.isInteger(options.skip) || options.skip < 0)) {
    err('Error: The --skip option must be a non-negative integer.')
    process.exit(1)
  }

  if (options.order !== undefined && !['newest', 'oldest'].includes(options.order)) {
    err("Error: The --order option must be either 'newest' or 'oldest'.")
    process.exit(1)
  }
}

/**
 * A helper function that validates RSS action input and processes it if valid.
 *
 * @param options - The ProcessingOptions containing RSS feed details.
 * @param handler - The function to handle each RSS feed.
 * @param llmServices - The optional LLM service for processing.
 * @param transcriptServices - The chosen transcription service.
 * @throws An error if no valid RSS URLs are provided for processing.
 * @returns A promise that resolves when all RSS feeds have been processed.
 */
export async function validateRSSAction(
  options: ProcessingOptions,
  handler: HandlerFunction,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Normalize RSS options so we always have arrays
  normalizeRSSOptions(options)

  // Validate the rest of the RSS-related flags
  validateRSSOptions(options)

  // For RSS feeds, process multiple URLs
  const rssUrls = options.rss
  if (!rssUrls || rssUrls.length === 0) {
    throw new Error(`No valid RSS URLs provided for processing`)
  }

  // Iterate over each RSS feed URL and process it
  for (const rssUrl of rssUrls) {
    await handler(options, rssUrl, llmServices, transcriptServices)
  }
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