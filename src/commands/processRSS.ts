// src/commands/processRSS.ts

/**
 * @file Process podcast episodes and other media content from RSS feeds with robust error handling and filtering options.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, wait, opts } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions, RSSItem } from '../types.js'

/**
 * Configure XML parser for RSS feed processing
 * Handles attributes without prefixes and allows boolean values
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/**
 * Validates RSS processing options for consistency and correct values.
 * 
 * @param options - Configuration options to validate
 * @throws Will exit process if validation fails
 */
function validateOptions(options: ProcessingOptions): void {
  if (options.last !== undefined) {
    if (!Number.isInteger(options.last) || options.last < 1) {
      console.error('Error: The --last option must be a positive integer.')
      process.exit(1)
    }
    if (options.skip !== undefined || options.order !== undefined) {
      console.error('Error: The --last option cannot be used with --skip or --order.')
      process.exit(1)
    }
  }

  if (options.skip !== undefined && (!Number.isInteger(options.skip) || options.skip < 0)) {
    console.error('Error: The --skip option must be a non-negative integer.')
    process.exit(1)
  }

  if (options.order !== undefined && !['newest', 'oldest'].includes(options.order)) {
    console.error("Error: The --order option must be either 'newest' or 'oldest'.")
    process.exit(1)
  }
}

/**
 * Logs the current processing action based on provided options.
 * 
 * @param options - Configuration options determining what to process
 */
function logProcessingAction(options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    log(wait('\nProcessing specific items:'))
    options.item.forEach((url) => log(wait(`  - ${url}`)))
  } else if (options.last) {
    log(wait(`\nProcessing the last ${options.last} items`))
  } else if (options.skip) {
    log(wait(`  - Skipping first ${options.skip || 0} items`))
  }
}

/**
 * Fetches and parses an RSS feed with timeout handling.
 * 
 * @param rssUrl - URL of the RSS feed to fetch
 * @returns The parsed RSS feed object
 * @throws Will exit process on network or parsing errors
 */
async function fetchRSSFeed(rssUrl: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

  try {
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/rss+xml' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      process.exit(1)
    }

    const text = await response.text()
    return parser.parse(text)
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('Error: Fetch request timed out.')
    } else {
      console.error(`Error fetching RSS feed: ${(error as Error).message}`)
    }
    process.exit(1)
  }
}

/**
 * Extracts and normalizes items from a parsed RSS feed.
 * 
 * @param feed - Parsed RSS feed object
 * @returns Array of normalized RSS items
 * @throws Will exit process if no valid items are found
 */
function extractFeedItems(feed: any): RSSItem[] {
  const { title: channelTitle, link: channelLink, image: channelImageObject, item: feedItems } = feed.rss.channel
  const channelImage = channelImageObject?.url || ''
  const feedItemsArray = Array.isArray(feedItems) ? feedItems : [feedItems]

  const items: RSSItem[] = feedItemsArray
    .filter((item) => {
      if (!item.enclosure || !item.enclosure.type) return false
      const audioVideoTypes = ['audio/', 'video/']
      return audioVideoTypes.some((type) => item.enclosure.type.startsWith(type))
    })
    .map((item) => ({
      showLink: item.enclosure.url,
      channel: channelTitle,
      channelURL: channelLink,
      title: item.title,
      description: '',
      publishDate: new Date(item.pubDate).toISOString().split('T')[0],
      coverImage: item['itunes:image']?.href || channelImage || '',
    }))

  if (items.length === 0) {
    console.error('Error: No audio/video items found in the RSS feed.')
    process.exit(1)
  }

  return items
}

/**
 * Saves feed information to a JSON file.
 * 
 * @param items - Array of RSS items to save
 */
async function saveFeedInfo(items: RSSItem[]): Promise<void> {
  const jsonContent = JSON.stringify(items, null, 2)
  const jsonFilePath = 'content/rss_info.json'
  await writeFile(jsonFilePath, jsonContent)
  log(wait(`RSS feed information saved to: ${jsonFilePath}`))
}

/**
 * Selects which items to process based on provided options.
 * 
 * @param items - All available RSS items
 * @param options - Configuration options for filtering
 * @returns Array of items to process
 * @throws Will exit process if no matching items are found
 */
function selectItemsToProcess(items: RSSItem[], options: ProcessingOptions): RSSItem[] {
  if (options.item && options.item.length > 0) {
    const matchedItems = items.filter((item) => options.item!.includes(item.showLink))
    if (matchedItems.length === 0) {
      console.error('Error: No matching items found for the provided URLs.')
      process.exit(1)
    }
    return matchedItems
  }

  if (options.last) {
    return items.slice(0, options.last)
  }

  const sortedItems = options.order === 'oldest' ? items.slice().reverse() : items
  return sortedItems.slice(options.skip || 0)
}

/**
 * Logs the processing status and item counts.
 */
function logProcessingStatus(total: number, processing: number, options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    log(wait(`\n  - Found ${total} items in the RSS feed.`))
    log(wait(`  - Processing ${processing} specified items.`))
  } else if (options.last) {
    log(wait(`\n  - Found ${total} items in the RSS feed.`))
    log(wait(`  - Processing the last ${options.last} items.`))
  } else {
    log(wait(`\n  - Found ${total} item(s) in the RSS feed.`))
    log(wait(`  - Processing ${processing} item(s) after skipping ${options.skip || 0}.\n`))
  }
}

/**
 * Processes a single RSS feed item.
 * 
 * @param options - Configuration options for processing
 * @param item - RSS item to process
 * @param llmServices - Optional language model service
 * @param transcriptServices - Optional transcription service
 */
async function processItem(
  options: ProcessingOptions,
  item: RSSItem,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processItem:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))

  try {
    const { frontMatter, finalPath, filename } = await generateMarkdown(options, item)
    await downloadAudio(options, item.showLink, filename)
    await runTranscription(options, finalPath, frontMatter, transcriptServices)
    await runLLM(options, finalPath, frontMatter, llmServices)

    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    console.error(`Error processing item ${item.title}: ${(error as Error).message}`)
  }
}

/**
 * Processes a batch of RSS items.
 */
async function processItems(
  items: RSSItem[],
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  for (const [index, item] of items.entries()) {
    log(opts(`\n========================================================================================`))
    log(opts(`  Item ${index + 1}/${items.length} processing: ${item.title}`))
    log(opts(`========================================================================================\n`))
    
    await processItem(options, item, llmServices, transcriptServices)
    
    log(opts(`\n========================================================================================`))
    log(opts(`  ${index + 1}/${items.length} item processing completed successfully`))
    log(opts(`========================================================================================\n`))
  }
}

/**
 * Main function to process an RSS feed.
 * See detailed documentation above regarding options and error handling.
 */
export async function processRSS(
  options: ProcessingOptions,
  rssUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processRSS:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`))

  try {
    validateOptions(options)
    logProcessingAction(options)

    const feed = await fetchRSSFeed(rssUrl)
    const items = extractFeedItems(feed)

    if (options.info) {
      await saveFeedInfo(items)
      return
    }

    const itemsToProcess = selectItemsToProcess(items, options)
    logProcessingStatus(items.length, itemsToProcess.length, options)
    await processItems(itemsToProcess, options, llmServices, transcriptServices)
  } catch (error) {
    console.error(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1)
  }
}