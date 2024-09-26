// src/commands/processPlaylist.js

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

/** @import { LLMOption, TranscriptOption, ProcessingOptions } from '../types.js' */

const execFilePromise = promisify(execFile)

/**
 * Main function to process a YouTube playlist.
 * @param {string} playlistUrl - The URL of the YouTube playlist to process.
 * @param {LLMOption} [llmOpt] - The selected Language Model option.
 * @param {TranscriptOption} [transcriptOpt] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processPlaylist(playlistUrl, llmOpt, transcriptOpt, options) {
  try {
    // Log the start of playlist processing
    console.log(`Processing playlist: ${playlistUrl}`)

    // Use yt-dlp to fetch video URLs from the playlist
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      playlistUrl
    ])

    // Check for errors in stderr
    if (stderr) {
      console.error(`yt-dlp error: ${stderr}`)
    }

    // Split the stdout into an array of video URLs
    const urls = stdout.trim().split('\n').filter(Boolean)
    console.log(`Found ${urls.length} videos in the playlist`)

    // Write the URLs to a file for reference
    try {
      await writeFile('content/urls.md', urls.join('\n'))
    } catch (writeError) {
      console.error('Error writing URLs to file:', writeError)
    }

    // Process each video in the playlist
    for (const [index, url] of urls.entries()) {
      console.log(`Processing video ${index + 1}/${urls.length}: ${url}`)
      try {
        // Process individual video
        await processVideo(url, llmOpt, transcriptOpt, options)
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