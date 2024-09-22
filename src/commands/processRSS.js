// src/commands/processRSS.js

/**
 * This module defines the function to process a podcast RSS feed. It handles fetching the RSS feed, parsing it, and
 * processing specific episodes based on user input. It supports processing multiple specific items or the entire feed.
 */

import { XMLParser } from 'fast-xml-parser'
import { generateRSSMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

// Initialize XML parser with specific options
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/**
 * Main function to process an RSS feed.
 * @param {string} rssUrl - The URL of the RSS feed to process.
 * @param {string} llmOpt - The selected Language Model option.
 * @param {string} transcriptOpt - The transcription service to use.
 * @param {object} options - Additional options for processing.
 */
export async function processRSS(rssUrl, llmOpt, transcriptOpt, options) {
  try {
    // Log the start of RSS feed processing
    console.log(`Processing RSS feed: ${rssUrl}`)

    if (options.item && options.item.length > 0) {
      // If specific items are provided, list them
      console.log(`Processing specific items:`)
      options.item.forEach((url) => console.log(`  - ${url}`))
    } else {
      // If no specific items, log the number of items to skip
      console.log(`Skipping first ${options.skip} items`)
    }

    // Fetch the RSS feed
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml',
      },
      timeout: 5000, // Set a timeout of 5 seconds
    })

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse the RSS feed content
    const buffer = await response.arrayBuffer()
    const text = Buffer.from(buffer).toString('utf-8')
    const feed = parser.parse(text)

    // Extract channel information
    const {
      title: channelTitle,
      link: channelLink,
      image: channelImageObject,
      item: feedItems,
    } = feed.rss.channel

    // Extract channel image URL safely
    const channelImage = channelImageObject?.url || ''

    // Initialize date formatter
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    // Filter and map feed items to extract necessary information
    const items = feedItems
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
        publishDate: dateFormatter.format(new Date(item.pubDate)),
        coverImage: item['itunes:image']?.href || channelImage || '',
      }))

    let itemsToProcess = []
    if (options.item && options.item.length > 0) {
      // Find the items matching the provided audio URLs
      const matchedItems = items.filter((item) => options.item.includes(item.showLink))
      if (matchedItems.length === 0) {
        console.error(`No matching items found for the provided URLs.`)
        return
      }
      itemsToProcess = matchedItems
    } else {
      // Sort items based on the specified order
      const sortedItems = options.order === 'newest' ? items : [...items].reverse()
      const skippedItems = sortedItems.slice(options.skip)
      itemsToProcess = skippedItems

      // Log information about found items
      console.log(
        `Found ${sortedItems.length} audio/video items in the RSS feed`
      )
      console.log(
        `Processing ${skippedItems.length} items after skipping ${options.skip}`
      )
    }

    // Process each item in the feed
    for (const [index, item] of itemsToProcess.entries()) {
      console.log(
        `Processing item ${index + options.skip + 1}/${itemsToProcess.length}: ${
          item.title
        }`
      )
      try {
        // Generate markdown for the item
        const { frontMatter, finalPath, filename } = await generateRSSMarkdown(item)

        // Download audio
        await downloadAudio(item.showLink, filename)

        // Run transcription
        await runTranscription(finalPath, transcriptOpt, options, frontMatter)

        // Process with Language Model
        await runLLM(finalPath, frontMatter, llmOpt, options)

        // Clean up temporary files if necessary
        if (!options.noCleanUp) {
          await cleanUpFiles(finalPath)
        }
        console.log(`\nProcess completed successfully for item: ${item.title}`)
      } catch (error) {
        console.error(`Error processing item: ${item.title}`, error)
      }
    }

    // Log completion of RSS feed processing
    console.log('RSS feed processing completed')
  } catch (error) {
    // Log any errors that occur during RSS feed processing
    console.error('Error fetching or parsing feed:', error)
    throw error
  }
}