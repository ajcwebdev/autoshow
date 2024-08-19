// src/commands/processPlaylist.js

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

export async function processPlaylist(playlistUrl, llmOption, whisperModelType) {
  try {
    console.log(`Processing playlist: ${playlistUrl}`)
    const { stdout } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      playlistUrl
    ])
    const urls = stdout.trim().split('\n').filter(Boolean)
    console.log(`Found ${urls.length} videos in the playlist`)
    await writeFile('content/urls.md', urls.join('\n'))
    for (const [index, url] of urls.entries()) {
      console.log(`Processing video ${index + 1}/${urls.length}: ${url}`)
      try {
        await processVideo(url, llmOption, whisperModelType)
      } catch (error) {
        console.error(`Error processing video ${url}:`, error)
      }
    }
    console.log('Playlist processing completed')
  } catch (error) {
    console.error('Error processing playlist:', error)
    throw error
  }
}