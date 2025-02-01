// src/utils/validate-option.ts

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
import { LLM_OPTIONS } from './step-utils/llm-utils'
import { TRANSCRIPTION_SERVICES } from '../../shared/constants'
import { validateRSSAction } from './command-utils/rss-utils'
import { XMLParser } from 'fast-xml-parser'

import type { TranscriptServices } from './types/transcription'
import type { LLMServices } from './types/llms'
import type { ProcessingOptions, VideoMetadata, VideoInfo, RSSItem, ValidAction, HandlerFunction } from './types/step-types'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

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

  // Determine transcript service or default to 'whisper' if not specified
  transcriptServices = TRANSCRIPTION_SERVICES.includes(requestData.transcriptServices)
    ? (requestData.transcriptServices as TranscriptServices)
    : 'whisper'

  // Set transcript options based on the selected service
  if (transcriptServices === 'whisper') {
    // Set the Whisper model or default to 'base'
    options.whisper = requestData.whisperModel || 'base'
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
 * Combines the validation logic for action, LLM, and transcription selection from the CLI options.
 *
 * @param options - The command-line options provided by the user
 * @returns An object containing the validated `action`, `llmServices`, and `transcriptServices`
 * @throws An error (and exits) if the action is invalid or missing
 */
export function validateInputCLI(options: ProcessingOptions): {
  action: ValidAction
  llmServices: LLMServices | undefined
  transcriptServices: TranscriptServices | undefined
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
  return llmKey as LLMServices
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

  // If no valid transcription service is found, return undefined
  return undefined
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
  action: ValidAction,
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
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
export function sanitizeTitle(title: string) {
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
}) {
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
) {
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