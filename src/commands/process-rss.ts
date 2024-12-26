// src/commands/process-rss.ts

/**
 * @file Process podcast episodes and other media content from RSS feeds with robust error handling and filtering options.
 * @packageDocumentation
 */

import { writeFile, readFile } from 'node:fs/promises'
import { generateMarkdown, sanitizeTitle } from '../utils/generate-markdown'
import { downloadAudio } from '../utils/download-audio'
import { runTranscription } from '../utils/run-transcription'
import { runLLM } from '../utils/run-llm'
import { cleanUpFiles } from '../utils/clean-up-files'
import { validateRSSOptions } from '../utils/validate-option'
import { l, err, logRSSProcessingAction, logRSSProcessingStatus, logRSSSeparator } from '../utils/logging'
import { parser } from '../types/globals'
import { db } from '../server/db'
import type { LLMServices, ProcessingOptions, RSSItem } from '../types/main'
import type { TranscriptServices } from '../types/transcript-service-types'

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
      err(`HTTP error! status: ${response.status}`)
      process.exit(1)
    }

    const text = await response.text()
    return parser.parse(text)
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      err('Error: Fetch request timed out.')
    } else {
      err(`Error fetching RSS feed: ${(error as Error).message}`)
    }
    process.exit(1)
  }
}

/**
 * Extracts and normalizes items from a parsed RSS feed.
 * 
 * @param feed - Parsed RSS feed object
 * @returns The items and channel title from the feed
 * @throws Will exit process if no valid items are found
 */
function extractFeedItems(feed: any): { items: RSSItem[], channelTitle: string } {
  const { title: channelTitle, link: channelLink, image: channelImageObject, item: feedItems } = feed.rss.channel
  const channelImage = channelImageObject?.url || ''
  const feedItemsArray = Array.isArray(feedItems) ? feedItems : [feedItems]
  const defaultDate = new Date().toISOString().substring(0, 10)

  const items: RSSItem[] = feedItemsArray
    .filter((item) => {
      if (!item.enclosure || !item.enclosure.type) return false
      const audioVideoTypes = ['audio/', 'video/']
      return audioVideoTypes.some((type) => item.enclosure.type.startsWith(type))
    })
    .map((item) => {
      // Ensure publishDate is always a valid string
      let publishDate: string
      try {
        // Try to parse the date, fall back to current date if invalid
        const date = item.pubDate ? new Date(item.pubDate) : new Date()
        publishDate = date.toISOString().substring(0, 10)
      } catch {
        // If date parsing fails, use current date
        publishDate = defaultDate
      }

      return {
        showLink: item.enclosure?.url || '',
        channel: channelTitle || '',
        channelURL: channelLink || '',
        title: item.title || '',
        description: '',
        publishDate,
        coverImage: item['itunes:image']?.href || channelImage || ''
      }
    })

  if (items.length === 0) {
    err('Error: No audio/video items found in the RSS feed.')
    process.exit(1)
  }

  return { items, channelTitle }
}

/**
 * Saves feed information to a JSON file.
 * 
 * @param items - Array of RSS items to save
 * @param channelTitle - The title of the RSS channel
 */
async function saveFeedInfo(items: RSSItem[], channelTitle: string): Promise<void> {
  const jsonContent = JSON.stringify(items, null, 2)
  const sanitizedTitle = sanitizeTitle(channelTitle)
  const jsonFilePath = `content/${sanitizedTitle}_info.json`
  await writeFile(jsonFilePath, jsonContent)
  l.wait(`RSS feed information saved to: ${jsonFilePath}`)
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
      err('Error: No matching items found for the provided URLs.')
      process.exit(1)
    }
    return matchedItems
  }

  if (options.lastDays !== undefined) {
    const now = new Date()
    const cutoff = new Date(now.getTime() - (options.lastDays * 24 * 60 * 60 * 1000))
  
    const matchedItems = items.filter((item) => {
      const itemDate = new Date(item.publishDate)
      return itemDate >= cutoff
    })
    return matchedItems
  }
  
  if (options.date && options.date.length > 0) {
    const selectedDates = new Set(options.date)
    const matchedItems = items.filter((item) => selectedDates.has(item.publishDate))
    return matchedItems
  }  

  if (options.last) {
    return items.slice(0, options.last)
  }

  const sortedItems = options.order === 'oldest' ? items.slice().reverse() : items
  return sortedItems.slice(options.skip || 0)
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
  l.opts('Parameters passed to processItem:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, item)
    await downloadAudio(options, item.showLink, filename)
    await runTranscription(options, finalPath, transcriptServices)
    await runLLM(options, finalPath, frontMatter, llmServices)

    // Determine the correct output file path based on whether an LLM was used
    let outputFilePath: string
    if (llmServices) {
      outputFilePath = `${finalPath}-${llmServices}-shownotes.md`
    } else {
      outputFilePath = `${finalPath}-prompt.md`
    }

    // Read the content of the output file
    const content = await readFile(outputFilePath, 'utf-8')

    // Extract title and publishDate from the metadata object
    const { title, publishDate } = metadata

    // Save the show note into the database
    db.prepare(
      `INSERT INTO show_notes (title, date, content) VALUES (?, ?, ?)`
    ).run(title, publishDate, content)

    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    err(`Error processing item ${item.title}: ${(error as Error).message}`)
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
    logRSSSeparator(index, items.length, item.title)
    await processItem(options, item, llmServices, transcriptServices)
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
  l.opts('Parameters passed to processRSS:\n')
  l.wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`)

  try {
    validateRSSOptions(options)
    logRSSProcessingAction(options)

    const feed = await fetchRSSFeed(rssUrl)
    const { items, channelTitle } = extractFeedItems(feed)

    if (options.info) {
      await saveFeedInfo(items, channelTitle)
      return
    }

    const itemsToProcess = selectItemsToProcess(items, options)
    if (itemsToProcess.length === 0) {
      l.wait(`\nNo items found matching the provided criteria for this feed. Skipping...`)
      return
    }
    logRSSProcessingStatus(items.length, itemsToProcess.length, options)
    await processItems(itemsToProcess, options, llmServices, transcriptServices)
  } catch (error) {
    err(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1)
  }
}