// src/process-commands/rss-utils.ts

import { l, err } from '../utils/logging'

import type { ProcessingOptions, ShowNoteMetadata, HandlerFunction } from '../utils/types'

/**
 * Validates RSS flags (e.g., --last, --skip, --order, --date, --lastDays) without requiring feed data.
 * 
 * @param options - The command-line options provided by the user
 * @throws Exits the process if any flag is invalid
 */
export function validateRSSOptions(options: ProcessingOptions) {
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
) {
  const defaultDate = new Date().toISOString().substring(0, 10)
  const unfilteredItems: ShowNoteMetadata[] = (feedItemsArray || [])
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

  let itemsToProcess = []

  if (options.item && options.item.length > 0) {
    itemsToProcess = unfilteredItems.filter((it) =>
      options.item!.includes(it.showLink || '')
    )
  } else if (options.lastDays !== undefined) {
    const now = new Date()
    const cutoff = new Date(now.getTime() - options.lastDays * 24 * 60 * 60 * 1000)

    itemsToProcess = unfilteredItems.filter((it) => {
      if (!it.publishDate) return false
      const itDate = new Date(it.publishDate)
      return itDate >= cutoff
    })
  } else if (options.date && options.date.length > 0) {
    const selectedDates = new Set(options.date)
    itemsToProcess = unfilteredItems.filter((it) =>
      it.publishDate && selectedDates.has(it.publishDate)
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
  llmServices?: string,
  transcriptServices?: string
) {
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }
  if (typeof options.rss === 'string') {
    options.rss = [options.rss]
  }

  /**
   * Expand any .md files among the --rss inputs by reading lines of feed URLs from those files,
   * then add them to the final options.rss array. If the file is not .md, treat it as a direct RSS feed path.
   * If it can't be accessed as a file, treat it as a remote RSS feed URL.
   *
   * @param {ProcessingOptions} options - The command-line options
   */
  const expandedRssUrls: string[] = []
  const fsPromises = await import('node:fs/promises')
  const path = await import('node:path')

  for (const rssUrl of options.rss || []) {
    try {
      await fsPromises.access(rssUrl)
      const ext = path.extname(rssUrl).toLowerCase()

      if (ext === '.md') {
        const content = await fsPromises.readFile(rssUrl, 'utf8')
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))

        if (lines.length === 0) {
          err(`Error: No RSS URLs found in the .md file: ${rssUrl}`)
          process.exit(1)
        }
        expandedRssUrls.push(...lines)
      } else {
        expandedRssUrls.push(rssUrl)
      }
    } catch {
      expandedRssUrls.push(rssUrl)
    }
  }

  options.rss = expandedRssUrls

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
 * Logs the processing status and item counts for RSS feeds.
 * 
 * @param total - Total number of RSS items found.
 * @param processing - Number of RSS items to process.
 * @param options - Configuration options.
 */
export function logRSSProcessingStatus(
  total: number,
  processing: number,
  options: ProcessingOptions
) {
  if (options.item && options.item.length > 0) {
    l.dim(`\n  - Found ${total} items in the RSS feed.`)
    l.dim(`  - Processing ${processing} specified items.`)
  } else if (options.last) {
    l.dim(`\n  - Found ${total} items in the RSS feed.`)
    l.dim(`  - Processing the last ${options.last} items.`)
  } else {
    l.dim(`\n  - Found ${total} item(s) in the RSS feed.`)
    l.dim(`  - Processing ${processing} item(s) after skipping ${options.skip || 0}.\n`)
  }
}

/**
 * Retries a given RSS fetch with an exponential backoff of 7 attempts (1s initial delay).
 * 
 * @param {() => Promise<Response>} fn - The function to execute for the RSS fetch
 * @returns {Promise<Response>} Resolves with the Response object if successful
 * @throws {Error} If fetch fails after all attempts
 */
export async function retryRSSFetch(
  fn: () => Promise<Response>
) {
  const maxRetries = 7
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      l.dim(`  Attempt ${attempt} - Fetching RSS...\n`)
      const response = await fn()
      l.dim(`\n  RSS fetch succeeded on attempt ${attempt}.`)
      return response
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting RSS fetch.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error('RSS fetch failed after maximum retries.')
}