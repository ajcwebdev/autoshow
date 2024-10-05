// src/commands/processRSS.js

import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'
import { generateRSSMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final, wait } from '../types.js'

/** @import { LLMServices, TranscriptServices, ProcessingOptions, RSSItem } from '../types.js' */

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
async function processItem(item, transcriptServices, llmServices, options) {
  // log(opts(`\nItem parameter passed to processItem:\n`))
  // log(item)
  try {
    // Generate markdown for the item
    const { frontMatter, finalPath, filename } = await generateRSSMarkdown(item)

    // Download audio
    await downloadAudio(item.showLink, filename)

    // Run transcription
    await runTranscription(finalPath, transcriptServices, options, frontMatter)

    // Process with Language Model
    await runLLM(finalPath, frontMatter, llmServices, options)

    // Clean up temporary files if necessary
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    log(final(`\nItem processing completed successfully: ${item.title}`))
  } catch (error) {
    console.error(`Error processing item ${item.title}: ${error.message}`)
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
export async function processRSS(rssUrl, llmServices, transcriptServices, options) {
  // log(opts(`Options received:\n`))
  // log(options)
  try {
    if (options.item && options.item.length > 0) {
      // If specific items are provided, list them
      log(wait('\nProcessing specific items:'))
      options.item.forEach((url) => log(`  - ${url}`))
    }

    // Fetch the RSS feed with a timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 10000) // 10 seconds timeout

    let response
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
      if (error.name === 'AbortError') {
        console.error('Error: Fetch request timed out.')
      } else {
        console.error(`Error fetching RSS feed: ${error.message}`)
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
    const items = feedItemsArray
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

    let itemsToProcess = []
    if (options.item && options.item.length > 0) {
      // Find the items matching the provided audio URLs
      const matchedItems = items.filter((item) => options.item.includes(item.showLink))
      if (matchedItems.length === 0) {
        console.error('Error: No matching items found for the provided URLs.')
        process.exit(1) // Exit with an error code
      }
      itemsToProcess = matchedItems
    } else {
      // Sort items based on the specified order and apply skip
      const sortedItems = options.order === 'newest' ? items : [...items].reverse()
      itemsToProcess = sortedItems.slice(options.skip)

      log(wait(`  Found ${sortedItems.length} items in the RSS feed.`))
      log(wait(`  - Processing ${itemsToProcess.length} items after skipping ${options.skip}.\n`))
    }

    // Process each item in the feed
    for (const [index, item] of itemsToProcess.entries()) {
      log(wait(`  Processing item ${index + 1}/${itemsToProcess.length}:\n    - ${item.title}\n`))
      await processItem(item, transcriptServices, llmServices, options)
    }

    log(final('\nRSS feed processing completed successfully.\n'))
  } catch (error) {
    console.error(`Error processing RSS feed: ${error.message}`)
    process.exit(1) // Exit with an error code
  }
}