// src/commands/processPlaylist.js

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

// Define the main function to process a YouTube playlist
export async function processPlaylist(playlistUrl, llmOpt, transcriptionService, options) {
  try {
    // Log the start of playlist processing
    console.log(`Processing playlist: ${playlistUrl}`)

    // Use yt-dlp to fetch video URLs from the playlist
    const { stdout } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      playlistUrl
    ])

    // Split the stdout into an array of video URLs
    const urls = stdout.trim().split('\n').filter(Boolean)
    console.log(`Found ${urls.length} videos in the playlist`)

    // Write the URLs to a file for reference
    await writeFile('content/urls.md', urls.join('\n'))

    // Process each video in the playlist
    for (const [index, url] of urls.entries()) {
      console.log(`Processing video ${index + 1}/${urls.length}: ${url}`)
      try {
        // Process individual video
        await processVideo(url, llmOpt, transcriptionService, options)
      } catch (error) {
        // Log any errors that occur during video processing
        console.error(`Error processing video ${url}:`, error)
      }
    }

    // Log completion of playlist processing
    console.log('Playlist processing completed')
  } catch (error) {
    // Log any errors that occur during playlist processing
    console.error('Error processing playlist:', error)
    throw error
  }
}