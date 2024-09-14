// src/commands/processRSS.js

import { XMLParser } from 'fast-xml-parser'
import { generateRSSMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

export async function processRSS(rssUrl, llmOpt, transcriptionService, options) {
  try {
    console.log(`Processing RSS feed: ${rssUrl}`)
    console.log(`Skipping first ${options.skip} items`)
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml',
      },
      timeout: 5000,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    const text = Buffer.from(buffer).toString('utf-8')
    const feed = parser.parse(text)
    const { 
      title: channelTitle, 
      link: channelLink, 
      image: { url: channelImage }, 
      item: feedItems 
    } = feed.rss.channel
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
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
    const sortedItems = options.order === 'newest' ? items : [...items].reverse()
    const skippedItems = sortedItems.slice(options.skip)
    console.log(`Found ${sortedItems.length} audio/video items in the RSS feed`)
    console.log(`Processing ${skippedItems.length} items after skipping ${options.skip}`)
    for (const [index, item] of skippedItems.entries()) {
      console.log(`Processing item ${index + options.skip + 1}/${sortedItems.length}: ${item.title}`)
      try {
        const { frontMatter, finalPath, filename } = await generateRSSMarkdown(item)
        await downloadAudio(item.showLink, filename)
        await runTranscription(finalPath, transcriptionService, options, frontMatter)
        await runLLM(finalPath, frontMatter, llmOpt, options)
        if (!options.noCleanUp) {
          await cleanUpFiles(finalPath)
        }
        console.log(`\nProcess completed successfully for item: ${item.title}`)
      } catch (error) {
        console.error(`Error processing item: ${item.title}`, error)
      }
    }
    console.log('RSS feed processing completed')
  } catch (error) {
    console.error('Error fetching or parsing feed:', error)
    throw error
  }
}