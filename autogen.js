// autogen.js

import { Command } from 'commander'
import { execSync } from 'child_process'
import fs from 'fs'

const program = new Command()

const ytAlias = `yt-dlp --extractor-args "youtube:player_client=ios,web"`

program
  .name("autogen")
  .description("Automated processing of YouTube videos and playlists")
  .version("1.0.0")
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')

program.action((options) => {
  if (options.video) {
    processVideo(options.video)
  }
  if (options.playlist) {
    processPlaylist(options.playlist)
  }
  if (options.urls) {
    processUrlsFile(options.urls)
  }
})

const baseModel = "whisper.cpp/models/ggml-base.bin"
// const mediumModel = "whisper.cpp/models/ggml-medium.bin"
// const largeV2Model = "whisper.cpp/models/ggml-large-v2.bin"

async function processVideo(url) {
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
    execSync(`${ytAlias} -x --audio-format wav --postprocessor-args "ffmpeg: -ar 16000" -o "${id}.wav" "${url}"`)
    execSync(`./whisper.cpp/main -m "${baseModel}" -f "${id}.wav" -of "${id}" --output-lrc`)

    const lrcPath = `${id}.lrc`
    const txtPath = `${id}.txt`
    const lrcContent = fs.readFileSync(lrcPath, 'utf8')
    const txtContent = lrcContent.split('\n')
        .filter(line => !line.startsWith('[by:whisper.cpp]'))
        .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
        .join('\n')
    fs.writeFileSync(txtPath, txtContent)

    const finalContent = [
      fs.readFileSync(`${id}.md`, 'utf8'),
      fs.readFileSync('prompt.md', 'utf8'),
      txtContent
    ].join('\n')
    fs.writeFileSync(`${final}.md`, finalContent)

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

function processPlaylist(playlistUrl) {
  const episodeUrls = execSync(`${ytAlias} --flat-playlist -s --print "url" "${playlistUrl}"`)
  const urls = episodeUrls.toString().split('\n').filter(Boolean)
  fs.writeFileSync(`content/urls.md`, `${episodeUrls}`)
  urls.forEach(url => {
    processVideo(url)
  })
}

function processUrlsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  const urls = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)
  urls.forEach(url => {
    processVideo(url)
  })
}

program.parse(process.argv)