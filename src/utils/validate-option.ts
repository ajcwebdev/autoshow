// src/utils/validate-option.ts

/**
 * @file Provides functions for validating user-supplied CLI options and filtering items for both RSS feeds and channels.
 * 
 * @remarks
 * This refactoring unifies aspects of RSS and channel processing by splitting option validation
 * (which checks flags like `--last` or `--skip`) from item filtering (which requires actual RSS or channel data).
 * 
 * @packageDocumentation
 */

import { unlink, writeFile } from 'node:fs/promises'
import { exit } from 'node:process'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { l, err } from '../utils/logging'
import { execPromise, execFilePromise, PROCESS_HANDLERS, ACTION_OPTIONS } from './globals/process'
import { LLM_OPTIONS } from './globals/llms'
import { TRANSCRIPT_OPTIONS, WHISPER_MODELS } from './globals/transcription'

import type { ProcessingOptions, ValidAction, HandlerFunction, VideoMetadata, VideoInfo, RSSItem } from './types/process'
import type { TranscriptServices } from './types/transcription'
import type { LLMServices, OllamaTagsResponse } from './types/llms'

/**
 * Validates CLI options by ensuring that only one of each set of conflicting options is provided,
 * and returning the validated action, chosen LLM services, and chosen transcription services.
 * 
 * @param options - The command-line options provided by the user
 * @returns An object containing the validated `action`, `llmServices`, and `transcriptServices`
 * @throws An error (and exits) if invalid or missing action, or multiple conflicting options
 */
export function validateCLIOptions(options: ProcessingOptions): {
  action: ValidAction
  llmServices: LLMServices | undefined
  transcriptServices: TranscriptServices
} {
  /**
   * Helper function to validate that only one option from a list is provided.
   * Prevents users from specifying multiple conflicting options simultaneously.
   *
   * @param optionKeys - The list of option keys to check
   * @param errorMessage - The prefix of the error message
   * @returns The selected option or undefined
   */
  function checkSingleOption(optionKeys: string[], errorMessage: string): string | undefined {
    const selectedOptions = optionKeys.filter((opt) => {
      const value = options[opt as keyof ProcessingOptions]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== false
    })

    if (selectedOptions.length > 1) {
      err(
        `Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`
      )
      exit(1)
    }

    return selectedOptions[0] as string | undefined
  }

  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  const selectedAction = checkSingleOption(actionValues, 'input option')
  if (!selectedAction || !(selectedAction in PROCESS_HANDLERS)) {
    err(`Invalid or missing action`)
    exit(1)
  }

  const action = selectedAction as ValidAction
  const llmKey = checkSingleOption(LLM_OPTIONS as string[], 'LLM option') as LLMServices | undefined
  const llmServices = llmKey

  const transcriptKey = checkSingleOption(TRANSCRIPT_OPTIONS, 'transcription option')
  const transcriptServices = (transcriptKey as TranscriptServices) || 'whisper'
  if (transcriptServices === 'whisper' && !options.whisper) {
    options.whisper = 'large-v3-turbo'
  }

  return { action, llmServices, transcriptServices }
}

/**
 * Validates RSS flags (e.g., --last, --skip, --order, --date, --lastDays) without requiring feed data.
 * 
 * @param options - The command-line options provided by the user
 * @throws Exits the process if any flag is invalid
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
 * Filters RSS feed items based on user-supplied options (e.g., item URLs, date ranges, etc.).
 * 
 * @param options - Configuration options to filter the feed items
 * @param feedItemsArray - Parsed array of RSS feed items (raw JSON from XML parser)
 * @param channelTitle - Title of the RSS channel (optional)
 * @param channelLink - URL to the RSS channel (optional)
 * @param channelImage - A fallback channel image URL (optional)
 * @returns Filtered RSS items based on the provided options
 */
export async function filterRSSItems(
  options: ProcessingOptions,
  feedItemsArray?: any,
  channelTitle?: string,
  channelLink?: string,
  channelImage?: string
): Promise<RSSItem[]> {
  const defaultDate = new Date().toISOString().substring(0, 10)
  const unfilteredItems: RSSItem[] = (feedItemsArray || [])
    .filter((item: any) => {
      if (!item.enclosure || !item.enclosure.type) return false
      const audioVideoTypes = ['audio/', 'video/']
      return audioVideoTypes.some((type) => item.enclosure.type.startsWith(type))
    })
    .map((item: any) => {
      let publishDate: string
      try {
        const date = item.pubDate ? new Date(item.pubDate) : new Date()
        publishDate = date.toISOString().substring(0, 10)
      } catch {
        publishDate = defaultDate
      }

      return {
        showLink: item.enclosure?.url || '',
        channel: channelTitle || '',
        channelURL: channelLink || '',
        title: item.title || '',
        description: '',
        publishDate,
        coverImage: item['itunes:image']?.href || channelImage || '',
      }
    })

  let itemsToProcess: RSSItem[] = []

  if (options.item && options.item.length > 0) {
    itemsToProcess = unfilteredItems.filter((it) =>
      options.item!.includes(it.showLink)
    )
  } else if (options.lastDays !== undefined) {
    const now = new Date()
    const cutoff = new Date(now.getTime() - options.lastDays * 24 * 60 * 60 * 1000)

    itemsToProcess = unfilteredItems.filter((it) => {
      const itDate = new Date(it.publishDate)
      return itDate >= cutoff
    })
  } else if (options.date && options.date.length > 0) {
    const selectedDates = new Set(options.date)
    itemsToProcess = unfilteredItems.filter((it) =>
      selectedDates.has(it.publishDate)
    )
  } else if (options.last) {
    itemsToProcess = unfilteredItems.slice(0, options.last)
  } else {
    const sortedItems =
      options.order === 'oldest'
        ? unfilteredItems.slice().reverse()
        : unfilteredItems
    itemsToProcess = sortedItems.slice(options.skip || 0)
  }

  return itemsToProcess
}

/**
 * A helper function that validates RSS action input and processes it if valid.
 * Separately validates flags with {@link validateRSSOptions} and leaves feed-item filtering to {@link filterRSSItems}.
 *
 * @param options - The ProcessingOptions containing RSS feed details
 * @param handler - The function to handle each RSS feed
 * @param llmServices - The optional LLM service for processing
 * @param transcriptServices - The chosen transcription service
 * @throws An error if no valid RSS URLs are provided
 * @returns A promise that resolves when all RSS feeds have been processed
 */
export async function validateRSSAction(
  options: ProcessingOptions,
  handler: HandlerFunction,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }
  if (typeof options.rss === 'string') {
    options.rss = [options.rss]
  }

  validateRSSOptions(options)

  const rssUrls = options.rss
  if (!rssUrls || rssUrls.length === 0) {
    throw new Error(`No valid RSS URLs provided for processing`)
  }

  for (const rssUrl of rssUrls) {
    await handler(options, rssUrl, llmServices, transcriptServices)
  }
}

/**
 * Combines the validation logic for action, LLM, and transcription selection from the CLI options,
 * returning an object containing the validated action, chosen LLM services, and chosen transcription services.
 *
 * @param options - The command-line options provided by the user
 * @returns An object containing the validated `action`, `llmServices`, and `transcriptServices`
 * @throws An error (and exits) if the action is invalid or missing
 */
export function validateInputCLI(options: ProcessingOptions): {
  action: ValidAction
  llmServices: LLMServices | undefined
  transcriptServices: TranscriptServices
} {
  // Validate which action was chosen
  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  const selectedAction = validateOption(actionValues, options, 'input option')
  if (!selectedAction || !(selectedAction in PROCESS_HANDLERS)) {
    err(`Invalid or missing action`)
    exit(1)
  }
  const action = selectedAction as ValidAction

  // Validate LLM
  const llmKey = validateOption(LLM_OPTIONS as string[], options, 'LLM option') as LLMServices | undefined
  const llmServices = llmKey

  // Validate transcription
  const transcriptKey = validateOption(TRANSCRIPT_OPTIONS, options, 'transcription option')
  const transcriptServices = (transcriptKey as TranscriptServices) || 'whisper'
  if (transcriptServices === 'whisper' && !options.whisper) {
    options.whisper = 'large-v3-turbo'
  }

  return { action, llmServices, transcriptServices }
}

/**
 * Routes the specified action to the appropriate handler or validation logic,
 * providing a single entry point for executing the user's command-line choices.
 *
 * @param action - The validated action user wants to run (e.g., "video", "rss", etc.)
 * @param options - The ProcessingOptions containing user inputs and flags
 * @param llmServices - The optional LLM service for processing
 * @param transcriptServices - The optional transcription service
 * @returns Promise<void> Resolves or rejects based on processing outcome
 * @throws {Error} If the action is invalid or the required input is missing
 */
export async function processAction(
  action: ValidAction,
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  const handler = PROCESS_HANDLERS[action]

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
 * Validates channel processing options for consistency and correct values.
 * Logs the current channel processing action based on provided options.
 * 
 * @param options - Configuration options to validate
 * @throws Will exit the process if validation fails
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

  if (options.last) {
    l.dim(`\nProcessing the last ${options.last} videos`)
  } else if (options.skip) {
    l.dim(`\nSkipping first ${options.skip || 0} videos`)
  }
}

/**
 * Removes temporary files generated during content processing.
 * Attempts to delete files with specific extensions and logs the results.
 * Silently ignores attempts to delete non-existent files.
 * 
 * Files cleaned up include:
 * - .wav: Audio files
 * 
 * @param {string} id - Base filename (without extension) used to identify related files.
 * @param {boolean} [ensureFolders] - If true, skip deletion to allow creation or preservation of metadata folders.
 * 
 * @returns {Promise<void>} Resolves when cleanup is complete.
 * 
 * @throws {Error} If deletion fails for reasons other than file not existing:
 *   - Permission denied
 *   - File is locked/in use
 *   - I/O errors
 * 
 * @example
 * try {
 *   await saveAudio('content/my-video-2024-03-21')
 *   // Will attempt to delete:
 *   // - content/my-video-2024-03-21.wav
 * } catch (error) {
 *   err('Cleanup failed:', error)
 * }
 */
export async function saveAudio(id: string, ensureFolders?: boolean) {
  if (ensureFolders) {
    // If "ensureFolders" is set, skip deleting files
    // (this can serve as a placeholder for ensuring directories)
    l.dim('\nSkipping cleanup to preserve or ensure metadata directories.\n')
    return
  }

  const extensions = ['.wav']
  l.dim(`  Temporary files deleted:`)

  for (const ext of extensions) {
    try {
      await unlink(`${id}${ext}`)
      l.dim(`    - ${id}${ext}`)
    } catch (error) {
      if (error instanceof Error && (error as Error).message !== 'ENOENT') {
        err(`Error deleting file ${id}${ext}: ${(error as Error).message}`)
      }
    }
  }
}

/**
 * Checks if whisper.cpp directory exists and, if missing, clones and compiles it.
 * Also checks if the chosen model file is present and, if missing, downloads it.
 * @param whisperModel - The requested Whisper model name (e.g. "turbo" or "large-v3-turbo")
 * @param modelGGMLName - The corresponding GGML model filename (e.g. "ggml-large-v3-turbo.bin")
 */
export async function checkWhisperDirAndModel(
  whisperModel: string,
  modelGGMLName: string
): Promise<void> {
  // OPTIONAL: If you want to handle "turbo" as an alias for "large-v3-turbo"
  // so the user can do --whisper=turbo but the script sees "large-v3-turbo".
  if (whisperModel === 'turbo') {
    whisperModel = 'large-v3-turbo'
  }

  // Double-check that the requested model is actually in WHISPER_MODELS,
  // to avoid passing an unrecognized name to download-ggml-model.sh
  if (!Object.prototype.hasOwnProperty.call(WHISPER_MODELS, whisperModel)) {
    throw new Error(
      `Unknown Whisper model "${whisperModel}". ` +
      `Please use one of: ${Object.keys(WHISPER_MODELS).join(', ')}`
    )
  }

  // 1. Ensure whisper.cpp is cloned and built
  if (!existsSync('./whisper.cpp')) {
    l.dim(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    try {
      await execPromise(
        'git clone https://github.com/ggerganov/whisper.cpp.git ' +
        '&& cmake -B whisper.cpp/build -S whisper.cpp ' +
        '&& cmake --build whisper.cpp/build --config Release'
      )
      l.dim(`\n    - whisper.cpp clone and compilation complete.\n`)
    } catch (cloneError) {
      err(`Error cloning/building whisper.cpp: ${(cloneError as Error).message}`)
      throw cloneError
    }
  } else {
    l.dim(`\n  Whisper.cpp repo is already available at:\n    - ./whisper.cpp\n`)
  }

  // Also check for whisper-cli binary, just in case
  const whisperCliPath = './whisper.cpp/build/bin/whisper-cli'
  if (!existsSync(whisperCliPath)) {
    l.dim(`\n  No whisper-cli binary found, rebuilding...\n`)
    try {
      await execPromise(
        'cmake -B whisper.cpp/build -S whisper.cpp ' +
        '&& cmake --build whisper.cpp/build --config Release'
      )
      l.dim(`\n    - whisper.cpp build completed.\n`)
    } catch (buildError) {
      err(`Error (re)building whisper.cpp: ${(buildError as Error).message}`)
      throw buildError
    }
  } else {
    l.dim(`  Found whisper-cli at:\n    - ${whisperCliPath}\n`)
  }

  // 2. Make sure the chosen model file is present
  const modelPath = `./whisper.cpp/models/${modelGGMLName}`
  if (!existsSync(modelPath)) {
    l.dim(`\n  Model not found locally, attempting download...\n    - ${whisperModel}\n`)
    try {
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
      l.dim('    - Model download completed.\n')
    } catch (modelError) {
      err(`Error downloading model: ${(modelError as Error).message}`)
      throw modelError
    }
  } else {
    l.dim(
      `  Model "${whisperModel}" is already available at:\n` +
      `    - ${modelPath}\n`
    )
  }
}

/**
 * checkOllamaServerAndModel()
 * ---------------------
 * Checks if the Ollama server is running, attempts to start it if not,
 * and ensures the specified model is available (pulling if needed).
 *
 * @param {string} ollamaHost - The Ollama host
 * @param {string} ollamaPort - The Ollama port
 * @param {string} ollamaModelName - The Ollama model name (e.g. 'qwen2.5:0.5b')
 * @returns {Promise<void>}
 */
export async function checkOllamaServerAndModel(
  ollamaHost: string,
  ollamaPort: string,
  ollamaModelName: string
): Promise<void> {
  // Helper to check if the Ollama server responds
  async function checkServer(): Promise<boolean> {
    try {
      const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
      return serverResponse.ok
    } catch (error) {
      return false
    }
  }

  l.dim(`[checkOllamaServerAndModel] Checking server: http://${ollamaHost}:${ollamaPort}`)

  // 1) Confirm the server is running
  if (await checkServer()) {
    l.dim('\n  Ollama server is already running...')
  } else {
    // If the Docker-based environment uses 'ollama' as hostname but it's not up, that's likely an error
    if (ollamaHost === 'ollama') {
      throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
    } else {
      // Attempt to spawn an Ollama server locally
      l.dim('\n  Ollama server is not running. Attempting to start it locally...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      ollamaProcess.unref()

      // Wait up to ~30 seconds for the server to respond
      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.dim('    - Ollama server is now ready.\n')
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

  // 2) Confirm the model is available; if not, pull it
  l.dim(`  Checking if model is available: ${ollamaModelName}`)
  try {
    const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
    if (!tagsResponse.ok) {
      throw new Error(`HTTP error! status: ${tagsResponse.status}`)
    }

    const tagsData = (await tagsResponse.json()) as OllamaTagsResponse
    const isModelAvailable = tagsData.models.some((m) => m.name === ollamaModelName)
    l.dim(`[checkOllamaServerAndModel] isModelAvailable=${isModelAvailable}`)

    if (!isModelAvailable) {
      l.dim(`\n  Model ${ollamaModelName} is NOT available; pulling now...`)
      const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaModelName }),
      })
      if (!pullResponse.ok) {
        throw new Error(`Failed to initiate pull for model ${ollamaModelName}`)
      }
      if (!pullResponse.body) {
        throw new Error('Response body is null while pulling model.')
      }

      const reader = pullResponse.body.getReader()
      const decoder = new TextDecoder()

      // Stream the JSON lines from the server
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.trim() === '') continue

          // Each line should be a JSON object from the Ollama server
          try {
            const parsedLine = JSON.parse(line)
            if (parsedLine.status === 'success') {
              l.dim(`    - Model ${ollamaModelName} pulled successfully.\n`)
              break
            }
          } catch (parseError) {
            err(`Error parsing JSON while pulling model: ${parseError}`)
          }
        }
      }
    } else {
      l.dim(`\n  Model ${ollamaModelName} is already available.\n`)
    }
  } catch (error) {
    err(`Error checking/pulling model: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Sanitizes a title string for use in filenames by:
 * - Removing special characters except spaces and hyphens
 * - Converting spaces and underscores to hyphens
 * - Converting to lowercase
 * - Limiting length to 200 characters
 * 
 * @param {string} title - The title to sanitize.
 * @returns {string} The sanitized title safe for use in filenames.
 * 
 * @example
 * sanitizeTitle('My Video Title! (2024)') // returns 'my-video-title-2024'
 */
export function sanitizeTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')      // Remove all non-word characters except spaces and hyphens
    .trim()                        // Remove leading and trailing whitespace
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with a single hyphen
    .toLowerCase()                 // Convert to lowercase
    .slice(0, 200)                 // Limit the length to 200 characters
}

/**
 * Builds the front matter content string array from the provided metadata object
 * 
 * @param {object} metadata - The metadata object
 * @param {string} metadata.showLink
 * @param {string} metadata.channel
 * @param {string} metadata.channelURL
 * @param {string} metadata.title
 * @param {string} metadata.description
 * @param {string} metadata.publishDate
 * @param {string} metadata.coverImage
 * @returns {string[]} The front matter array
 */
export function buildFrontMatter(metadata: {
  showLink: string
  channel: string
  channelURL: string
  title: string
  description: string
  publishDate: string
  coverImage: string
}): string[] {
  return [
    '---',
    `showLink: "${metadata.showLink}"`,
    `channel: "${metadata.channel}"`,
    `channelURL: "${metadata.channelURL}"`,
    `title: "${metadata.title}"`,
    `description: "${metadata.description}"`,
    `publishDate: "${metadata.publishDate}"`,
    `coverImage: "${metadata.coverImage}"`,
    '---\n',
  ]
}

/**
 * Saves metadata or feed information to a JSON file, consolidating the logic from the original
 * savePlaylistInfo, saveURLsInfo, saveChannelInfo, and saveRSSFeedInfo functions.
 *
 * @param type - The type of data to save ('playlist', 'urls', 'channel', or 'rss')
 * @param data - The actual data to process and save:
 *   - For 'playlist' or 'urls': an array of string URLs
 *   - For 'channel': an array of VideoInfo objects
 *   - For 'rss': an array of RSSItem objects
 * @param title - The title or name associated with the data (e.g., a playlist/channel title)
 * @returns A Promise that resolves when the file has been written successfully
 */
export async function saveInfo(
  type: 'playlist' | 'urls' | 'channel' | 'rss',
  data: string[] | VideoInfo[] | RSSItem[],
  title?: string
): Promise<void> {
  // Handle RSS items (no metadata extraction needed, just save as-is)
  if (type === 'rss') {
    const items = data as RSSItem[]
    const jsonContent = JSON.stringify(items, null, 2)
    const sanitizedTitle = sanitizeTitle(title || '')
    const jsonFilePath = `content/${sanitizedTitle}_info.json`
    await writeFile(jsonFilePath, jsonContent)
    l.dim(`RSS feed information saved to: ${jsonFilePath}`)
    return
  }

  // Handle channel, playlist, or urls (extract metadata via yt-dlp)
  let urls: string[] = []
  let outputFilePath = ''
  let successLogFunction = l.success

  if (type === 'channel') {
    const videosToProcess = data as VideoInfo[]
    // Convert VideoInfo objects to an array of strings (URLs)
    urls = videosToProcess.map((video) => video.url)
    outputFilePath = 'content/channel_info.json'
    successLogFunction = l.success
  } else if (type === 'playlist') {
    urls = data as string[]
    const sanitizedTitle = sanitizeTitle(title || 'playlist')
    outputFilePath = `content/${sanitizedTitle}_info.json`
    successLogFunction = l.success
  } else if (type === 'urls') {
    urls = data as string[]
    const date = new Date().toISOString().split('T')[0]
    const uniqueId = Date.now()
    outputFilePath = `content/urls_info_${date}_${uniqueId}.json`
    // For URLs, we use l.wait to log
    successLogFunction = l.wait
  }

  const metadataList = await Promise.all(
    urls.map(async (url) => {
      try {
        // Execute yt-dlp command to extract metadata
        const { stdout } = await execFilePromise('yt-dlp', [
          '--restrict-filenames',
          '--print', '%(webpage_url)s',
          '--print', '%(channel)s',
          '--print', '%(uploader_url)s',
          '--print', '%(title)s',
          '--print', '%(upload_date>%Y-%m-%d)s',
          '--print', '%(thumbnail)s',
          url,
        ])

        const [
          showLink, channel, channelURL, vidTitle, publishDate, coverImage
        ] = stdout.trim().split('\n')

        if (!showLink || !channel || !channelURL || !vidTitle || !publishDate || !coverImage) {
          throw new Error('Incomplete metadata received from yt-dlp.')
        }

        return {
          showLink,
          channel,
          channelURL,
          title: vidTitle,
          description: '',
          publishDate,
          coverImage,
        } as VideoMetadata
      } catch (error) {
        err(
          `Error extracting metadata for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return null
      }
    })
  )

  const validMetadata = metadataList.filter(
    (metadata): metadata is VideoMetadata => metadata !== null
  )

  const jsonContent = JSON.stringify(validMetadata, null, 2)
  await writeFile(outputFilePath, jsonContent)
  successLogFunction(`${type === 'urls' ? 'Video' : type.charAt(0).toUpperCase() + type.slice(1)} information saved to: ${outputFilePath}`)
}