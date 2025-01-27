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
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { exit } from 'node:process'
import { processVideo } from '../process-commands/video'
import { processPlaylist } from '../process-commands/playlist'
import { processChannel } from '../process-commands/channel'
import { processURLs } from '../process-commands/urls'
import { processFile } from '../process-commands/file'
import { processRSS } from '../process-commands/rss'
import { l, err } from '../utils/logging'
import { LLM_OPTIONS } from './llm-utils'
import { TRANSCRIPT_OPTIONS } from './transcription-utils'

import type { TranscriptServices } from './types/transcription'
import type { LLMServices } from './types/llms'
import type { ProcessingOptions, VideoMetadata, VideoInfo, RSSItem, ValidAction, HandlerFunction } from './types/process'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

import { XMLParser } from 'fast-xml-parser'

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

/* ------------------------------------------------------------------
 * Prompt & Action Choices
 * ------------------------------------------------------------------ */

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
 * Provides user-friendly prompt choices for content generation or summary tasks.
 * 
 */
export const PROMPT_CHOICES: Array<{ name: string; value: string }> = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'FAQ', value: 'faq' },
  { name: 'Blog', value: 'blog' },
  { name: 'Rap Song', value: 'rapSong' },
  { name: 'Rock Song', value: 'rockSong' },
  { name: 'Country Song', value: 'countrySong' },
]

/**
 * Available action options for content processing with additional metadata.
 * 
 */
export const ACTION_OPTIONS: Array<{
  name: string
  description: string
  message: string
  validate: (input: string) => boolean | string
}> = [
  {
    name: 'video',
    description: 'Single YouTube Video',
    message: 'Enter the YouTube video URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'playlist',
    description: 'YouTube Playlist',
    message: 'Enter the YouTube playlist URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'channel',
    description: 'YouTube Channel',
    message: 'Enter the YouTube channel URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'urls',
    description: 'List of URLs from File',
    message: 'Enter the file path containing URLs:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'file',
    description: 'Local Audio/Video File',
    message: 'Enter the local audio/video file path:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'rss',
    description: 'Podcast RSS Feed',
    message: 'Enter the podcast RSS feed URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
]

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