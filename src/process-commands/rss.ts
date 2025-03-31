// src/process-commands/rss.ts

import { logRSSProcessingStatus, filterRSSItems, retryRSSFetch } from './rss-utils.ts'
import { generateMarkdown } from '../process-steps/01-generate-markdown.ts'
import { saveInfo } from '../process-steps/01-generate-markdown-utils.ts'
import { downloadAudio } from '../process-steps/02-download-audio.ts'
import { saveAudio } from '../process-steps/02-download-audio-utils.ts'
import { runTranscription } from '../process-steps/03-run-transcription.ts'
import { selectPrompts } from '../process-steps/04-select-prompt.ts'
import { runLLM } from '../process-steps/05-run-llm.ts'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging.ts'
import { parser } from '../utils/node-utils.ts'

import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

/**
 * Fetches and parses an RSS feed (URL or local file path), then applies filtering via {@link filterRSSItems}.
 * 
 * @param rssUrl - URL or local file path of the RSS feed to parse
 * @param options - Configuration options
 * @returns A promise that resolves to an object with filtered RSS items and the channel title
 * @throws Will exit the process on network or parsing errors
 */
export async function selectRSSItemsToProcess(
  rssUrl: string,
  options: ProcessingOptions
) {
  try {
    const fsPromises = await import('node:fs/promises')
    await fsPromises.access(rssUrl)

    const text = await fsPromises.readFile(rssUrl, 'utf8')
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
  } catch {}

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await retryRSSFetch(
      () => fetch(rssUrl, {
        method: 'GET',
        headers: { Accept: 'application/rss+xml' },
        signal: controller.signal,
      })
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
  llmServices?: string,
  transcriptServices?: string
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
        if (item.showLink) {
          await downloadAudio(options, item.showLink, filename)
        } else {
          throw new Error(`showLink is undefined for item: ${item.title}`)
        }
        const { transcript, transcriptionCost, modelId: transcriptionModel } = await runTranscription(options, finalPath, transcriptServices)
        const selectedPrompts = await selectPrompts(options)
        const llmOutput = await runLLM(
          options,
          finalPath,
          frontMatter,
          selectedPrompts,
          transcript,
          metadata as ShowNoteMetadata,
          llmServices,
          transcriptServices,
          transcriptionModel,
          transcriptionCost
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