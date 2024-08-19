// src/commands/processRSS.js

import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'
import {
  downloadAudio,
  runTranscription,
  runLLM,
  cleanUpFiles
} from '../utils/exports.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

async function processItem(item, llmOption, whisperModelType) {
  const { showLink, channel, channelURL, title, publishDate, coverImage } = item
  try {
    const filename = `${publishDate}-${title.replace(/[^a-zA-Z0-9]/g, '_')}`
    const finalPath = `content/${filename}`
    const frontMatter = [
      "---",
      `showLink: "${showLink}"`,
      `channel: "${channel}"`,
      `channelURL: "${channelURL}"`,
      `title: "${title}"`,
      `publishDate: "${publishDate}"`,
      `coverImage: "${coverImage}"`,
      "---\n"
    ].join('\n')

    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md`)

    await downloadAudio(showLink, filename)
    await runTranscription(finalPath, whisperModelType, frontMatter)
    await runLLM(finalPath, frontMatter, llmOption)
    await cleanUpFiles(finalPath)

    console.log(`\nProcess completed successfully for item: ${title}`)
  } catch (error) {
    console.error(`Error processing item: ${title}`, error)
  }
}

export async function processRSS(rssUrl, llmOption, whisperModelType, order = 'newest') {
  try {
    console.log(`Processing RSS feed: ${rssUrl}`)
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
    const channelTitle = feed.rss.channel.title
    const channelLink = feed.rss.channel.link
    const channelImage = feed.rss.channel.image.url

    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    const items = feed.rss.channel.item.map(item => ({
      showLink: item.enclosure.url,
      channel: channelTitle,
      channelURL: channelLink,
      title: item.title,
      publishDate: dateFormatter.format(new Date(item.pubDate)),
      coverImage: item['itunes:image']?.href || channelImage,
    }))

    const sortedItems = order === 'newest' ? items : [...items].reverse()

    console.log(`Found ${sortedItems.length} items in the RSS feed`)
    for (const [index, item] of sortedItems.entries()) {
      console.log(`Processing item ${index + 1}/${sortedItems.length}: ${item.title}`)
      await processItem(item, llmOption, whisperModelType)
    }

    console.log('RSS feed processing completed')
  } catch (error) {
    console.error('Error fetching or parsing feed:', error)
    throw error
  }
}