// src/process-commands/rss.ts

/**
 * @file Process podcast episodes and other media content from RSS feeds with robust error handling and filtering options.
 * 
 * @remarks
 * This refactoring aligns RSS processing with the structure used for channel processing:
 * 1. Validate flags up front (see {@link validateRSSOptions}).
 * 2. Fetch and parse feed items in a selection function (`selectRSSItemsToProcess`).
 * 3. Filter items (see {@link filterRSSItems}).
 * 4. If `--info` is set, save info and skip further processing.
 * 5. Otherwise, process items in a loop, similar to channel videos.
 * 
 * @packageDocumentation
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { selectPrompts } from '../process-steps/04-select-prompt'
import { runLLM } from '../process-steps/05-run-llm'
import { saveAudio, saveInfo, parser } from '../utils/validate-option'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging'
import { logRSSProcessingStatus, filterRSSItems } from '../utils/command-utils/rss-utils'
import { retryRSSFetch } from '../utils/step-utils/retry'

import type { ProcessingOptions, RSSItem } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'


/**
 * Fetches and parses an RSS feed, then applies filtering via {@link filterRSSItems}.
 * 
 * @param rssUrl - URL of the RSS feed to fetch
 * @param options - Configuration options
 * @returns A promise that resolves to an object with filtered RSS items and the channel title
 * @throws Will exit the process on network or parsing errors
 */
export async function selectRSSItemsToProcess(
  rssUrl: string,
  options: ProcessingOptions
): Promise<{ items: RSSItem[]; channelTitle: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await retryRSSFetch(
      () => fetch(rssUrl, {
        method: 'GET',
        headers: { Accept: 'application/rss+xml' },
        signal: controller.signal,
      }),
      5,
      5000
    )
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

    const feedItemsArray = Array.isArray(feedItems) ? feedItems : [feedItems]
    if (!feedItemsArray || feedItemsArray.length === 0) {
      err('Error: No items found in the RSS feed.')
      process.exit(1)
    }

    const itemsToProcess = await filterRSSItems(
      options,
      feedItemsArray,
      channelTitle,
      channelLink,
      channelImageObject?.url
    )

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
 * Main function to process items from an RSS feed by generating markdown, downloading audio,
 * transcribing, selecting a prompt, and possibly running an LLM.
 * 
 * @param options - The ProcessingOptions containing RSS feed details and filters
 * @param rssUrl - The URL of the RSS feed to process
 * @param llmServices - Optional LLM services for advanced processing
 * @param transcriptServices - The chosen transcription service for audio content
 * @returns A promise that resolves when the feed has been fully processed
 */
export async function processRSS(
  options: ProcessingOptions,
  rssUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
) {
  logInitialFunctionCall('processRSS', { llmServices, transcriptServices })

  if (options.item && options.item.length > 0) {
    l.dim('\nProcessing specific items:')
    options.item.forEach((url) => l.dim(`  - ${url}`))
  } else if (options.last) {
    l.dim(`\nProcessing the last ${options.last} items`)
  } else if (options.skip) {
    l.dim(`  - Skipping first ${options.skip || 0} items`)
  }

  try {
    const { items, channelTitle } = await selectRSSItemsToProcess(rssUrl, options)

    if (options.info) {
      if (items.length > 0) {
        await saveAudio('', true)
        await saveInfo('rss', items, channelTitle || '')
      }
      return
    }

    if (items.length === 0) {
      l.dim('\nNo items found matching the provided criteria for this feed. Skipping...')
      return
    }

    logRSSProcessingStatus(items.length, items.length, options)

    const results = []

    for (const [index, item] of items.entries()) {
      logSeparator({
        type: 'rss',
        index,
        total: items.length,
        descriptor: item.title
      })

      l.opts('Parameters passed to processItem:\n')
      l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

      try {
        const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, item)
        await downloadAudio(options, item.showLink, filename)
        const transcript = await runTranscription(options, finalPath, transcriptServices)
        const selectedPrompts = await selectPrompts(options)
        const llmOutput = await runLLM(
          options,
          finalPath,
          frontMatter,
          selectedPrompts,
          transcript,
          metadata,
          llmServices
        )
        if (!options.saveAudio) {
          await saveAudio(finalPath)
        }
        results.push({
          frontMatter,
          prompt: selectedPrompts,
          llmOutput: llmOutput || '',
          transcript,
        })
      } catch (error) {
        err(`Error processing item ${item.title}: ${(error as Error).message}`)
        results.push({
          frontMatter: '',
          prompt: '',
          llmOutput: '',
          transcript: '',
        })
      }
    }
  } catch (error) {
    err(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1)
  }
}