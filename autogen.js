import { Command } from 'commander'
import { execSync } from 'child_process'
import fs from 'fs'

const program = new Command()

program
  .name("autogen")
  .description("Automated processing of YouTube videos and playlists")
  .version("1.0.0")

program.command('video <url>')
  .description('Process a single YouTube video')
  .action((url) => {
    processVideo(url)
  })

program.command('playlist <playlistUrl>')
  .description('Process all videos in a YouTube playlist')
  .action((playlistUrl) => {
    processPlaylist(playlistUrl)
  })

program.command('urls <filePath>')
  .description('Process YouTube videos from a list of URLs in a file')
  .action((filePath) => {
    processUrlsFile(filePath)
  })

async function processVideo(url) {
  try {
    const videoId = execSync(`yt-dlp --print id "${url}"`).toString().trim()
    const uploadDate = execSync(`yt-dlp --print filename -o "%(upload_date>%Y-%m-%d)s" "${url}"`).toString().trim()
    const id = `content/${videoId}`
    const final = `content/${uploadDate}-${videoId}`
    const baseModel = "whisper.cpp/models/ggml-large-v2.bin"

    const mdContent = [
      "---",
      `showLink: "${execSync(`yt-dlp --print webpage_url "${url}"`).toString().trim()}"`,
      `channel: "${execSync(`yt-dlp --print uploader "${url}"`).toString().trim()}"`,
      `channelURL: "${execSync(`yt-dlp --print uploader_url "${url}"`).toString().trim()}"`,
      `title: "${execSync(`yt-dlp --print title "${url}"`).toString().trim()}"`,
      `publishDate: "${uploadDate}"`,
      `coverImage: "${execSync(`yt-dlp --print thumbnail "${url}"`).toString().trim()}"`,
      "---\n"
    ].join('\n')

    fs.writeFileSync(`${id}.md`, mdContent)
    execSync(`yt-dlp -x --audio-format wav --postprocessor-args "ffmpeg: -ar 16000" -o "${id}.wav" "${url}"`)
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
  const urls = execSync(`yt-dlp --flat-playlist -s --print "url" "${playlistUrl}"`).toString().split('\n').filter(Boolean)
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