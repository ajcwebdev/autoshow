// src/process-commands/rss.ts

import { logRSSProcessingStatus, filterRSSItems, retryRSSFetch } from './rss-utils.ts'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging.ts'
import { parser } from '../utils/node-utils.ts'
import { saveAudio } from '../process-steps/02-download-audio-utils.ts'
import { saveInfo } from '../process-steps/01-generate-markdown-utils.ts'
import {
  createProcessContext,
  stepGenerateMarkdown,
  stepDownloadAudio,
  stepRunTranscription,
  stepSelectPrompts,
  stepRunLLM
} from '../process-steps/workflow-context.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

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
  } catch {
    // If not a local file, do a network fetch
  }

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
    const e = error instanceof Error ? error : new Error(String(error))
    if (e.name === 'AbortError') {
      err('Error: Fetch request timed out.')
    } else {
      err(`Error fetching RSS feed: ${e.message}`)
    }
    process.exit(1)
  }
}

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

      l.opts(`\n  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

      try {
        const ctx = createProcessContext(options, item.showLink || '')
        await stepGenerateMarkdown(ctx)
        if (ctx.metadata && item.description) {
          ctx.metadata.description = item.description
        }
        if (item.showLink) {
          await stepDownloadAudio(ctx)
        } else {
          throw new Error(`showLink is undefined for item: ${item.title}`)
        }
        await stepRunTranscription(ctx, transcriptServices)
        await stepSelectPrompts(ctx)
        await stepRunLLM(ctx, llmServices, transcriptServices)

        if (!options.saveAudio && ctx.finalPath) {
          await saveAudio(ctx.finalPath)
        }

        results.push({
          frontMatter: ctx.frontMatter || '',
          prompt: ctx.selectedPrompts || '',
          llmOutput: ctx.llmOutput || '',
          transcript: ctx.transcript || ''
        })
      } catch (subErr) {
        const e = subErr instanceof Error ? subErr : new Error(String(subErr))
        err(`Error processing item ${item.title}: ${e.message}`)
        results.push({
          frontMatter: '',
          prompt: '',
          llmOutput: '',
          transcript: ''
        })
      }
    }
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    err(`Error processing RSS feed: ${e.message}`)
    process.exit(1)
  }
}
