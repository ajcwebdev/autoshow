// autogen.js

import { Command } from 'commander'
import { execSync } from 'child_process'
import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'

const program = new Command()
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

const ytAlias = `yt-dlp --no-warnings --extractor-args "youtube:player_client=ios,web"`

program
  .name("autogen")
  .description("Automated processing of YouTube videos, playlists, and podcast RSS feeds")
  .version("1.0.0")
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-r, --rss <rssUrl>', 'Process podcast episodes from an RSS feed')
  .option('-m, --model <type>', 'Select model to use: base, medium, or large', 'large')

program.action(async (options) => {
  const model = getModel(options.model)
  if (options.video) {
    await processVideo(options.video, model)
  }
  if (options.playlist) {
    await processPlaylist(options.playlist, model)
  }
  if (options.urls) {
    await processUrlsFile(options.urls, model)
  }
  if (options.rss) {
    await processRssFeed(options.rss, model)
  }
})

function getModel(modelType) {
  switch (modelType) {
    case 'base':
      return "whisper.cpp/models/ggml-base.bin"
    case 'medium':
      return "whisper.cpp/models/ggml-medium.bin"
    case 'large':
      return "whisper.cpp/models/ggml-large-v2.bin"
    default:
      console.error(`Unknown model type: ${modelType}`)
      process.exit(1)
  }
}

async function processVideo(url, model) {
  try {
    const videoId = execSync(`${ytAlias} --print id "${url}"`).toString().trim()
    const uploadDate = execSync(`${ytAlias} --print filename -o "%(upload_date>%Y-%m-%d)s" "${url}"`).toString().trim()
    const id = `content/${videoId}`
    const final = `content/${uploadDate}-${videoId}`

    const mdContent = [
      "---",
      `showLink: "${execSync(`${ytAlias} --print webpage_url "${url}"`).toString().trim()}"`,
      `channel: "${execSync(`${ytAlias} --print uploader "${url}"`).toString().trim()}"`,
      `channelURL: "${execSync(`${ytAlias} --print uploader_url "${url}"`).toString().trim()}"`,
      `title: "${execSync(`${ytAlias} --print title "${url}"`).toString().trim()}"`,
      `publishDate: "${uploadDate}"`,
      `coverImage: "${execSync(`${ytAlias} --print thumbnail "${url}"`).toString().trim()}"`,
      "---\n"
    ].join('\n')

    fs.writeFileSync(`${id}.md`, mdContent)
    console.log(`Markdown file completed successfully: ${id}.md`)

    execSync(`${ytAlias} -x --audio-format wav --postprocessor-args "ffmpeg: -ar 16000" -o "${id}.wav" "${url}"`)
    console.log(`WAV file completed successfully: ${id}.wav`)

    execSync(`./whisper.cpp/main -m "${model}" -f "${id}.wav" -of "${id}" --output-lrc > /dev/null 2>&1`)
    console.log(`Transcript file completed successfully: ${id}.lrc`)

    const lrcPath = `${id}.lrc`
    const txtPath = `${id}.txt`
    const lrcContent = fs.readFileSync(lrcPath, 'utf8')
    const txtContent = lrcContent.split('\n')
        .filter(line => !line.startsWith('[by:whisper.cpp]'))
        .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
        .join('\n')
    fs.writeFileSync(txtPath, txtContent)
    console.log(`Transcript file transformed successfully: ${id}.txt`)

    const finalContent = [
      fs.readFileSync(`${id}.md`, 'utf8'),
      fs.readFileSync('prompt.md', 'utf8'),
      txtContent
    ].join('\n')
    fs.writeFileSync(`${final}.md`, finalContent)
    console.log(`Prompt concatenated to transformed transcript successfully: ${final}.md`)

    // Clean up
    fs.unlinkSync(`${id}.wav`)
    fs.unlinkSync(lrcPath)
    fs.unlinkSync(txtPath)
    fs.unlinkSync(`${id}.md`)

    console.log(`Process completed successfully for URL: ${url}`)
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
  }
}

async function processPlaylist(playlistUrl, model) {
  const episodeUrls = execSync(`${ytAlias} --flat-playlist -s --print "url" "${playlistUrl}"`)
  const urls = episodeUrls.toString().split('\n').filter(Boolean)
  fs.writeFileSync(`content/urls.md`, `${episodeUrls}`)
  for (const url of urls) {
    await processVideo(url, model)
  }
}

async function processUrlsFile(filePath, model) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  const urls = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)
  for (const url of urls) {
    await processVideo(url, model)
  }
}

async function processRssFeed(rssUrl, model) {
  try {
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

    for (const item of items) {
      await processRssItem(item, model)
    }
  } catch (error) {
    console.error('Error fetching or parsing feed:', error)
  }
}

async function processRssItem(item, model) {
  try {
    const id = `content/${item.publishDate}-${item.title.replace(/[^a-zA-Z0-9]/g, '_')}`
    const mdContent = [
      "---",
      `showLink: "${item.showLink}"`,
      `channel: "${item.channel}"`,
      `channelURL: "${item.channelURL}"`,
      `title: "${item.title}"`,
      `publishDate: "${item.publishDate}"`,
      `coverImage: "${item.coverImage}"`,
      "---\n"
    ].join('\n')

    fs.writeFileSync(`${id}.md`, mdContent)
    console.log(`Markdown file completed successfully: ${id}.md`)

    execSync(`ffmpeg -i "${item.showLink}" -ar 16000 "${id}.wav"`)
    console.log(`WAV file completed successfully: ${id}.wav`)

    execSync(`./whisper.cpp/main -m "${model}" -f "${id}.wav" -of "${id}" --output-lrc > /dev/null 2>&1`)
    console.log(`Transcript file completed successfully: ${id}.lrc`)

    const lrcPath = `${id}.lrc`
    const txtPath = `${id}.txt`
    const lrcContent = fs.readFileSync(lrcPath, 'utf8')
    const txtContent = lrcContent.split('\n')
        .filter(line => !line.startsWith('[by:whisper.cpp]'))
        .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
        .join('\n')
    fs.writeFileSync(txtPath, txtContent)
    console.log(`Transcript file transformed successfully: ${id}.txt`)

    const finalContent = [
      fs.readFileSync(`${id}.md`, 'utf8'),
      fs.readFileSync('prompt.md', 'utf8'),
      txtContent
    ].join('\n')
    fs.writeFileSync(`${id}.md`, finalContent)
    console.log(`Prompt concatenated to transformed transcript successfully: ${id}.md`)

    // Clean up
    fs.unlinkSync(`${id}.wav`)
    fs.unlinkSync(lrcPath)
    fs.unlinkSync(txtPath)

    console.log(`Process completed successfully for RSS item: ${item.title}`)
  } catch (error) {
    console.error(`Error processing RSS item: ${item.title}`, error)
  }
}

program.parse(process.argv)