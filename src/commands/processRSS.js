// src/commands/processRSS.js

import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

function generateRSSMarkdown(item) {
  const frontMatter = [
    "---",
    `showLink: "${item.showLink}"`,
    `channel: "${item.channel}"`,
    `channelURL: "${item.channelURL}"`,
    `title: "${item.title}"`,
    `publishDate: "${item.publishDate}"`,
    `coverImage: "${item.coverImage}"`,
    "---\n"
  ].join('\n')
  return frontMatter
}

export async function processRSS(rssUrl, llmOption, whisperModelType, order = 'newest', skip = 0) {
  try {
    console.log(`Processing RSS feed: ${rssUrl}`)
    console.log(`Skipping first ${skip} items`)
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
    const items = feedItems.map(item => ({
      showLink: item.enclosure.url,
      channel: channelTitle,
      channelURL: channelLink,
      title: item.title,
      publishDate: dateFormatter.format(new Date(item.pubDate)),
      coverImage: item['itunes:image']?.href || channelImage,
    }))
    const sortedItems = order === 'newest' ? items : [...items].reverse()
    const skippedItems = sortedItems.slice(skip)
    console.log(`Found ${sortedItems.length} items in the RSS feed`)
    console.log(`Processing ${skippedItems.length} items after skipping ${skip}`)
    for (const [index, item] of skippedItems.entries()) {
      console.log(`Processing item ${index + skip + 1}/${sortedItems.length}: ${item.title}`)
      try {
        const filename = `${item.publishDate}-${item.title.replace(/[^a-zA-Z0-9]/g, '_')}`
        const finalPath = `content/${filename}`
        const frontMatter = generateRSSMarkdown(item)
        await writeFile(`${finalPath}.md`, frontMatter)
        console.log(`\nInitial markdown file created:\n  - ${finalPath}.md`)
        await downloadAudio(item.showLink, filename)
        await runTranscription(finalPath, whisperModelType, frontMatter)
        await runLLM(finalPath, frontMatter, llmOption)
        await cleanUpFiles(finalPath)
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