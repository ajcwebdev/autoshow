// src/process-commands/rss.ts

/**
 * @file Process podcast episodes and other media content from RSS feeds with robust error handling and filtering options.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { selectPrompts } from '../process-steps/04-select-prompt'
import { runLLM } from '../process-steps/05-run-llm'
import { validateRSSOptions, saveAudio, saveRSSFeedInfo } from '../utils/validate-option'
import { l, err, logSeparator, logInitialFunctionCall, logRSSProcessingStatus } from '../utils/logging'

import type { ProcessingOptions, RSSItem } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

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
 * Fetches and parses an RSS feed, then filters which items to process based on provided options.
 * 
 * @param rssUrl - URL of the RSS feed to fetch
 * @param options - Configuration options for filtering
 * @returns A promise that resolves to an object with filtered RSS items and the channel title
 * @throws Will exit the process on network or parsing errors, or if no valid items are found
 */
export async function selectItems(
  rssUrl: string,
  options: ProcessingOptions
): Promise<{ items: RSSItem[]; channelTitle: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: { Accept: 'application/rss+xml' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      err(`HTTP error! status: ${response.status}`)
      process.exit(1)
    }

    const text = await response.text()
    const feed = parser.parse(text)
    const {
      title: channelTitle,
      link: channelLink,
      image: channelImageObject,
      item: feedItems,
    } = feed.rss.channel
    const channelImage = channelImageObject?.url || ''
    const feedItemsArray = Array.isArray(feedItems) ? feedItems : [feedItems]
    const defaultDate = new Date().toISOString().substring(0, 10)

    // Build the unfiltered items array (audio/video only)
    const unfilteredItems: RSSItem[] = feedItemsArray
      .filter((item) => {
        if (!item.enclosure || !item.enclosure.type) return false
        const audioVideoTypes = ['audio/', 'video/']
        return audioVideoTypes.some((type) => item.enclosure.type.startsWith(type))
      })
      .map((item) => {
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

    if (unfilteredItems.length === 0) {
      err('Error: No audio/video items found in the RSS feed.')
      process.exit(1)
    }

    // Now apply the filtering logic
    let itemsToProcess: RSSItem[] = []

    if (options.item && options.item.length > 0) {
      itemsToProcess = unfilteredItems.filter((item) =>
        options.item!.includes(item.showLink)
      )
      if (itemsToProcess.length === 0) {
        err('Error: No matching items found for the provided URLs.')
        process.exit(1)
      }
    } else if (options.lastDays !== undefined) {
      const now = new Date()
      const cutoff = new Date(now.getTime() - options.lastDays * 24 * 60 * 60 * 1000)

      itemsToProcess = unfilteredItems.filter((item) => {
        const itemDate = new Date(item.publishDate)
        return itemDate >= cutoff
      })
    } else if (options.date && options.date.length > 0) {
      const selectedDates = new Set(options.date)
      itemsToProcess = unfilteredItems.filter((item) =>
        selectedDates.has(item.publishDate)
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

    return { items: itemsToProcess, channelTitle: channelTitle || '' }
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
 * Processes a single RSS item by generating markdown, downloading audio, transcribing,
 * selecting a prompt, and possibly running an LLM. 
 * 
 * Now returns an object containing frontMatter, the prompt, the LLM output, and transcript.
 * 
 * @param item - A single RSS item to process
 * @param options - Global processing options
 * @param llmServices - Optional LLM services
 * @param transcriptServices - Optional transcription services
 * @returns An object containing frontMatter, prompt, llmOutput, and transcript
 */
export async function processItems(
  item: RSSItem,
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
) {
  l.opts('Parameters passed to processItem:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, item)

    // Step 2 - Download audio and convert to WAV
    await downloadAudio(options, item.showLink, filename)

    // Step 3 - Transcribe audio and read transcript
    const transcript = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Select Prompt
    const selectedPrompts = await selectPrompts(options)

    // Step 5 - Run LLM (optional)
    // (Adjust return value from runLLM if needed to capture desired data)
    const llmOutput = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata,
      llmServices
    )

    // Clean up downloaded audio if not saving
    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: llmOutput || '',
      transcript,
    }
  } catch (error) {
    err(`Error processing item ${item.title}: ${(error as Error).message}`)
    return {
      frontMatter: '',
      prompt: '',
      llmOutput: '',
      transcript: '',
    }
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
  // Log the processing parameters for debugging purposes
  logInitialFunctionCall('processRSS', { llmServices, transcriptServices })

  try {
    validateRSSOptions(options)

    // Combined fetch + filtering now happens in selectItems:
    const { items, channelTitle } = await selectItems(rssUrl, options)

    // If --info, just save and exit
    if (options.info) {
      await saveRSSFeedInfo(items, channelTitle)
      return
    }

    // If no filtered items remain, skip
    if (items.length === 0) {
      l.wait('\nNo items found matching the provided criteria for this feed. Skipping...')
      return
    }

    // Log info about the filter results and process
    logRSSProcessingStatus(items.length, items.length, options)

    const results = []

    for (const [index, item] of items.entries()) {
      logSeparator({
        type: 'rss',
        index,
        total: items.length,
        descriptor: item.title
      })
      const result = await processItems(item, options, llmServices, transcriptServices)
      results.push(result)
    }

  } catch (error) {
    err(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1)
  }
}