// src/commands/processRSS.ts

import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final, wait, opts } from '../models.js'

import type { LLMServices, TranscriptServices, ProcessingOptions, RSSItem } from '../types.js'

// Initialize XML parser with specific options
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/**
 * Process a single item from the RSS feed.
 * @param {RSSItem} item - The item to process.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
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
    const { frontMatter, finalPath, filename } = await generateMarkdown(options, item)  // Generate markdown for the item
    await downloadAudio(options, item.showLink, filename)                               // Download audio
    await runTranscription(options, finalPath, frontMatter, transcriptServices)         // Run transcription
    await runLLM(options, finalPath, frontMatter, llmServices)                          // Process with Language Model
    if (!options.noCleanUp) {                                                           // Clean up temporary files if necessary
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    console.error(`Error processing item ${item.title}: ${(error as Error).message}`)
    // Continue processing the next item
  }
}

/**
 * Main function to process an RSS feed.
 * @param {string} rssUrl - The URL of the RSS feed to process.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processRSS(
  options: ProcessingOptions,
  rssUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processRSS:\n'))
  log(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`)
  try {
    // Validate that --last is a positive integer if provided
    if (options.last !== undefined) {
      if (!Number.isInteger(options.last) || options.last < 1) {
        console.error('Error: The --last option must be a positive integer.')
        process.exit(1)
      }
      // Ensure --last is not used with --skip or --order
      if (options.skip !== undefined || options.order !== undefined) {
        console.error('Error: The --last option cannot be used with --skip or --order.')
        process.exit(1)
      }
    }

    // Validate that --skip is a non-negative integer if provided
    if (options.skip !== undefined) {
      if (!Number.isInteger(options.skip) || options.skip < 0) {
        console.error('Error: The --skip option must be a non-negative integer.')
        process.exit(1)
      }
    }

    // Validate that --order is either 'newest' or 'oldest' if provided
    if (options.order !== undefined) {
      if (!['newest', 'oldest'].includes(options.order)) {
        console.error("Error: The --order option must be either 'newest' or 'oldest'.")
        process.exit(1)
      }
    }

    // Log the processing action
    if (options.item && options.item.length > 0) {
      // If specific items are provided, list them
      log(wait('\nProcessing specific items:'))
      options.item.forEach((url) => log(wait(`  - ${url}`)))
    } else if (options.last) {
      log(wait(`\nProcessing the last ${options.last} items`))
    } else if (options.skip) {
      log(wait(`  - Skipping first ${options.skip || 0} items`))
    }

    // Fetch the RSS feed with a timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 10000) // 10 seconds timeout

    let response: Response
    try {
      response = await fetch(rssUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml',
        },
        signal: controller.signal,
      })
      clearTimeout(timeout)
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.error('Error: Fetch request timed out.')
      } else {
        console.error(`Error fetching RSS feed: ${(error as Error).message}`)
      }
      process.exit(1) // Exit with an error code
    }

    // Check if the response is successful
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      process.exit(1) // Exit with an error code
    }

    // Parse the RSS feed content
    const text = await response.text()
    const feed = parser.parse(text)

    // Extract channel and item information
    const {
      title: channelTitle,
      link: channelLink,
      image: channelImageObject,
      item: feedItems,
    } = feed.rss.channel

    // Extract channel image URL safely
    const channelImage = channelImageObject?.url || ''

    // Ensure feedItems is an array
    const feedItemsArray = Array.isArray(feedItems) ? feedItems : [feedItems]

    // Filter and map feed items
    const items: RSSItem[] = feedItemsArray
      .filter((item) => {
        // Ensure the item has an enclosure with a valid type
        if (!item.enclosure || !item.enclosure.type) return false
        const audioVideoTypes = ['audio/', 'video/']
        // Include only audio or video items
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
      process.exit(1) // Exit with an error code
    }

    // Generate JSON file with RSS feed information if --info option is used
    if (options.info) {
      const jsonContent = JSON.stringify(items, null, 2)
      const jsonFilePath = 'content/rss_info.json'
      await writeFile(jsonFilePath, jsonContent)
      log(wait(`RSS feed information saved to: ${jsonFilePath}`))
      return
    }

    let itemsToProcess: RSSItem[] = []
    if (options.item && options.item.length > 0) {
      // Find the items matching the provided audio URLs
      const matchedItems = items.filter((item) => options.item!.includes(item.showLink))
      if (matchedItems.length === 0) {
        console.error('Error: No matching items found for the provided URLs.')
        process.exit(1) // Exit with an error code
      }
      itemsToProcess = matchedItems
      log(wait(`\n  - Found ${items.length} items in the RSS feed.`))
      log(wait(`  - Processing ${itemsToProcess.length} specified items.`))
    } else if (options.last) {
      // Process the most recent N items
      itemsToProcess = items.slice(0, options.last)
      log(wait(`\n  - Found ${items.length} items in the RSS feed.`))
      log(wait(`  - Processing the last ${options.last} items.`))
    } else {
      // Sort items based on the specified order and apply skip
      const sortedItems = options.order === 'oldest' ? items.slice().reverse() : items
      itemsToProcess = sortedItems.slice(options.skip || 0)
      log(wait(`\n  - Found ${items.length} item(s) in the RSS feed.`))
      log(wait(`  - Processing ${itemsToProcess.length} item(s) after skipping ${options.skip || 0}.\n`))
    }

    // Process each item in the feed
    for (const [index, item] of itemsToProcess.entries()) {
      log(opts(`\n==============================================================`))
      log(opts(`  Item ${index + 1}/${itemsToProcess.length} processing: ${item.title}`))
      log(opts(`==============================================================\n`))
      await processItem(options, item, llmServices, transcriptServices)
      log(final(`\n==============================================================`))
      log(final(`  ${index + 1}/${itemsToProcess.length} item processing completed successfully`))
      log(final(`==============================================================\n`))
    }
  } catch (error) {
    console.error(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1) // Exit with an error code
  }
}