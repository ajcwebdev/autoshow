// src/utils/validate-option.ts

import { unlink, writeFile } from 'node:fs/promises'
import { exit } from 'node:process'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { l, err } from '../utils/logging'
import { execPromise, execFilePromise, PROCESS_HANDLERS, ACTION_OPTIONS } from './globals/process'
import { LLM_OPTIONS } from './globals/llms'
import { TRANSCRIPT_OPTIONS } from './globals/transcription'

import type { ProcessingOptions, ValidAction, HandlerFunction, VideoMetadata, VideoInfo, RSSItem } from './types/process'
import type { TranscriptServices } from './types/transcription'
import type { LLMServices, OllamaTagsResponse } from './types/llms'

/**
 * Validates RSS processing options for consistency, logs the current RSS processing action,
 * and checks for correct values.
 * 
 * @param options - Configuration options to validate.
 * @throws Will exit the process if validation fails.
 */
export function validateRSSOptions(options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    l.wait('\nProcessing specific items:')
    options.item.forEach((url) => l.wait(`  - ${url}`))
  } else if (options.last) {
    l.wait(`\nProcessing the last ${options.last} items`)
  } else if (options.skip) {
    l.wait(`  - Skipping first ${options.skip || 0} items`)
  }

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
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }
  if (typeof options.rss === 'string') {
    options.rss = [options.rss]
  }

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
 * Removes temporary files generated during content processing.
 * Attempts to delete files with specific extensions and logs the results.
 * Silently ignores attempts to delete non-existent files.
 * 
 * Files cleaned up include:
 * - .wav: Audio files
 * - .txt: Transcription text
 * - .md: Markdown content
 * - .lrc: Lyrics/subtitles
 * 
 * @param {string} id - Base filename (without extension) used to identify related files.
 *                     All files matching pattern `${id}${extension}` will be deleted.
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
 *   // - content/my-video-2024-03-21.txt
 *   // - content/my-video-2024-03-21.md
 *   // - content/my-video-2024-03-21.lrc
 * } catch (error) {
 *   err('Cleanup failed:', error)
 * }
 */
export async function saveAudio(id: string) {
  l.step('\nStep 6 - Cleaning Up Extra Files\n')
  // Define extensions of temporary files to be cleaned up
  const extensions = [
    '.wav',  // Audio files
  ]

  l.wait(`\n  Temporary files deleted:`)

  // Attempt to delete each file type
  for (const ext of extensions) {
    try {
      // Delete file and log success
      await unlink(`${id}${ext}`)
      l.wait(`    - ${id}${ext}`)
    } catch (error) {
      // Only log errors that aren't "file not found" (ENOENT)
      if (error instanceof Error && (error as Error).message !== 'ENOENT') {
        err(`Error deleting file ${id}${ext}: ${(error as Error).message}`)
      }
      // Silently continue if file doesn't exist
    }
  }
}

/**
 * Checks if whisper.cpp directory exists and, if missing, clones and compiles it.
 * Also checks if the chosen model file is present and, if missing, downloads it.
 * @param {string} whisperModel - The requested Whisper model name
 * @param {string} modelGGMLName - The corresponding GGML model filename
 * @returns {Promise<void>}
 */
export async function checkWhisperDirAndModel(
  whisperModel: string,
  modelGGMLName: string
): Promise<void> {
  // Check if whisper.cpp directory is present
  if (!existsSync('./whisper.cpp')) {
    l.wait(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    try {
      await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && cmake -B whisper.cpp/build -S whisper.cpp && cmake --build whisper.cpp/build --config Release')
      l.wait(`\n    - whisper.cpp clone and compilation complete.\n`)
    } catch (cloneError) {
      err(`Error cloning/building whisper.cpp: ${(cloneError as Error).message}`)
      throw cloneError
    }
  } else {
    l.wait(`\n  Whisper.cpp repo is already available at:\n    - ./whisper.cpp\n`)
  }

  // Check if the chosen model file is present
  if (!existsSync(`./whisper.cpp/models/${modelGGMLName}`)) {
    l.wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`)
    try {
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
      l.wait('    - Model download completed, running transcription...\n')
    } catch (modelError) {
      err(`Error downloading model: ${(modelError as Error).message}`)
      throw modelError
    }
  } else {
    l.wait(`  Model ${whisperModel} is already available at\n    - ./whisper.cpp/models/${modelGGMLName}\n`)
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

  l.info(`[checkOllamaServerAndModel] Checking server: http://${ollamaHost}:${ollamaPort}`)

  // 1) Confirm the server is running
  if (await checkServer()) {
    l.wait('\n  Ollama server is already running...')
  } else {
    // If the Docker-based environment uses 'ollama' as hostname but it's not up, that's likely an error
    if (ollamaHost === 'ollama') {
      throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
    } else {
      // Attempt to spawn an Ollama server locally
      l.wait('\n  Ollama server is not running. Attempting to start it locally...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      ollamaProcess.unref()

      // Wait up to ~30 seconds for the server to respond
      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.wait('    - Ollama server is now ready.\n')
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
  l.wait(`  Checking if model is available: ${ollamaModelName}`)
  try {
    const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
    if (!tagsResponse.ok) {
      throw new Error(`HTTP error! status: ${tagsResponse.status}`)
    }

    const tagsData = (await tagsResponse.json()) as OllamaTagsResponse
    const isModelAvailable = tagsData.models.some((m) => m.name === ollamaModelName)
    l.info(`[checkOllamaServerAndModel] isModelAvailable=${isModelAvailable}`)

    if (!isModelAvailable) {
      l.wait(`\n  Model ${ollamaModelName} is NOT available; pulling now...`)
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
 * Saves metadata for all videos in the playlist to a JSON file if `--info` is provided.
 * 
 * @param urls - Array of all video URLs in the playlist
 * @param playlistTitle - Title of the YouTube playlist
 * @returns Promise that resolves when the JSON file has been saved
 */
export async function savePlaylistInfo(urls: string[], playlistTitle: string): Promise<void> {
  // Collect metadata for all videos in parallel
  const metadataList = await Promise.all(
    urls.map(async (url: string) => {
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

        // Split the output into individual metadata fields
        const [
          showLink, channel, channelURL, title, publishDate, coverImage
        ] = stdout.trim().split('\n')

        // Validate that all required metadata fields are present
        if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
          throw new Error('Incomplete metadata received from yt-dlp.')
        }

        // Return the metadata object
        return {
          showLink,
          channel,
          channelURL,
          title,
          description: '',
          publishDate,
          coverImage,
        } as VideoMetadata
      } catch (error) {
        // Log error but return null to filter out failed extractions
        err(
          `Error extracting metadata for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return null
      }
    })
  )

  // Filter out any null results due to errors
  const validMetadata = metadataList.filter(
    (metadata): metadata is VideoMetadata => metadata !== null
  )

  // Save metadata to a JSON file
  const jsonContent = JSON.stringify(validMetadata, null, 2)
  const sanitizedTitle = sanitizeTitle(playlistTitle)
  const jsonFilePath = `content/${sanitizedTitle}_info.json`
  await writeFile(jsonFilePath, jsonContent)
  l.success(`Playlist information saved to: ${jsonFilePath}`)
}

/**
 * Saves metadata for all videos in the provided URLs to a JSON file.
 *
 * @param urls - The list of video URLs
 * @returns Promise that resolves when the JSON file is saved
 */
export async function saveURLsInfo(urls: string[]): Promise<void> {
  // Collect metadata for all videos in parallel
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

        // Split the output into individual metadata fields
        const [
          showLink, channel, channelURL, title, publishDate, coverImage
        ] = stdout.trim().split('\n')

        // Validate that all required metadata fields are present
        if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
          throw new Error('Incomplete metadata received from yt-dlp.')
        }

        // Return the metadata object
        return {
          showLink, channel, channelURL, title, description: '', publishDate, coverImage
        } as VideoMetadata
      } catch (error) {
        // Log error but return null to filter out failed extractions
        err(
          `Error extracting metadata for ${url}: ${error instanceof Error ? error.message : String(error)}`
        )
        return null
      }
    })
  )

  // Filter out any null results due to errors
  const validMetadata = metadataList.filter(
    (metadata): metadata is VideoMetadata => metadata !== null
  )

  // Save metadata to a JSON file
  const jsonContent = JSON.stringify(validMetadata, null, 2)
  const date = new Date().toISOString().split('T')[0]
  const uniqueId = Date.now()
  const jsonFilePath = `content/urls_info_${date}_${uniqueId}.json`
  await writeFile(jsonFilePath, jsonContent)
  l.wait(`Video information saved to: ${jsonFilePath}`)
}

/**
 * Saves channel info for the selected videos to a JSON file.
 * 
 * @param videosToProcess - The videos selected for processing
 * @throws If metadata extraction fails
 */
export async function saveChannelInfo(videosToProcess: VideoInfo[]): Promise<void> {
  // Collect metadata for selected videos in parallel
  const metadataList = await Promise.all(
    videosToProcess.map(async (video) => {
      const url = video.url
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

        // Split the output into individual metadata fields
        const [
          showLink, channel, channelURL, title, publishDate, coverImage
        ] = stdout.trim().split('\n')

        // Validate that all required metadata fields are present
        if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
          throw new Error('Incomplete metadata received from yt-dlp.')
        }

        // Return the metadata object
        return {
          showLink, channel, channelURL, title, description: '', publishDate, coverImage
        } as VideoMetadata
      } catch (error) {
        // Log error but return null to filter out failed extractions
        err(
          `Error extracting metadata for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return null
      }
    })
  )

  // Filter out any null results due to errors
  const validMetadata = metadataList.filter(
    (metadata): metadata is VideoMetadata => metadata !== null
  )

  // Save metadata to a JSON file
  const jsonContent = JSON.stringify(validMetadata, null, 2)
  const jsonFilePath = 'content/channel_info.json'
  await writeFile(jsonFilePath, jsonContent)
  l.success(`Channel information saved to: ${jsonFilePath}`)
}

/**
 * Saves feed information to a JSON file.
 * 
 * @param items - Array of RSS items to save
 * @param channelTitle - The title of the RSS channel
 */
export async function saveRSSFeedInfo(items: RSSItem[], channelTitle: string): Promise<void> {
  const jsonContent = JSON.stringify(items, null, 2)
  const sanitizedTitle = sanitizeTitle(channelTitle)
  const jsonFilePath = `content/${sanitizedTitle}_info.json`
  await writeFile(jsonFilePath, jsonContent)
  l.wait(`RSS feed information saved to: ${jsonFilePath}`)
}