// src/commands/processRSS.js

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

// Define the main function to process an RSS feed
export async function processRSS(rssUrl, llmOpt, transcriptionService, options) {
  try {
    // Log the start of RSS feed processing
    console.log(`Processing RSS feed: ${rssUrl}`)
    console.log(`Skipping first ${options.skip} items`)

    // Fetch the RSS feed
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml',
      },
      timeout: 5000,
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
      image: { url: channelImage }, 
      item: feedItems 
    } = feed.rss.channel

    // Initialize date formatter
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    // Filter and map feed items
    const items = feedItems
      .filter(item => {
        if (!item.enclosure || !item.enclosure.type) return false
        const audioVideoTypes = ['audio/', 'video/']
        return audioVideoTypes.some(type => item.enclosure.type.startsWith(type))
      })
      .map(item => ({
        showLink: item.enclosure.url,
        channel: channelTitle,
        channelURL: channelLink,
        title: item.title,
        publishDate: dateFormatter.format(new Date(item.pubDate)),
        coverImage: item['itunes:image']?.href || channelImage,
      }))

    // Sort items based on the specified order
    const sortedItems = options.order === 'newest' ? items : [...items].reverse()
    const skippedItems = sortedItems.slice(options.skip)

    // Log information about found items
    console.log(`Found ${sortedItems.length} audio/video items in the RSS feed`)
    console.log(`Processing ${skippedItems.length} items after skipping ${options.skip}`)

    // Process each item in the feed
    for (const [index, item] of skippedItems.entries()) {
      console.log(`Processing item ${index + options.skip + 1}/${sortedItems.length}: ${item.title}`)
      try {
        // Generate markdown for the item
        const { frontMatter, finalPath, filename } = await generateRSSMarkdown(item)

        // Download audio
        await downloadAudio(item.showLink, filename)

        // Run transcription
        await runTranscription(finalPath, transcriptionService, options, frontMatter)

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