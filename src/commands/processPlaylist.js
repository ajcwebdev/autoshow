// src/commands/processPlaylist.js

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { extractVideoMetadata } from '../utils/generateMarkdown.js'
import { checkDependencies } from '../utils/checkDependencies.js'

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
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Fetch video URLs from the playlist
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      playlistUrl
    ])

    if (stderr) {
      console.error(`yt-dlp warnings: ${stderr}`)
    }

    // Split the stdout into an array of video URLs
    const urls = stdout.trim().split('\n').filter(Boolean)
    if (urls.length === 0) {
      console.error('Error: No videos found in the playlist.')
      process.exit(1) // Exit with an error code
    }

    console.log(`\nFound ${urls.length} videos in the playlist`)

    // Extract metadata for all videos
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)

    // Generate JSON file with playlist information if --info option is used
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/playlist_info.json'
      await writeFile(jsonFilePath, jsonContent)
      console.log(`Playlist information saved to: ${jsonFilePath}`)
      return
    }

    // Process each video in the playlist
    for (const [index, url] of urls.entries()) {
      console.log(`\nProcessing video ${index + 1}/${urls.length}: ${url}`)
      try {
        await processVideo(url, llmOpt, transcriptOpt, options)
      } catch (error) {
        console.error(`Error processing video ${url}: ${error.message}`)
        // Continue processing the next video
      }
    }

    console.log('\nPlaylist processing completed successfully.\n')
  } catch (error) {
    console.error(`Error processing playlist: ${error.message}`)
    process.exit(1) // Exit with an error code
  }
}