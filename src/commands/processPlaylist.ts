// src/commands/processPlaylist.ts

import { writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/extractVideoMetadata.js'
import { checkDependencies } from '../utils/checkDependencies.js'
import { log, opts, success, wait } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

const execFilePromise = promisify(execFile)

/**
 * Main function to process a YouTube playlist.
 * @param playlistUrl - The URL of the YouTube playlist to process.
 * @param llmServices - The selected Language Model option.
 * @param transcriptServices - The transcription service to use.
 * @param options - Additional options for processing.
 */
export async function processPlaylist(
  options: ProcessingOptions,
  playlistUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processPlaylist:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`))
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

    log(opts(`\nFound ${urls.length} videos in the playlist...`))

    // Extract metadata for all videos
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)

    // Generate JSON file with playlist information if --info option is used
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/playlist_info.json'
      await writeFile(jsonFilePath, jsonContent)
      log(success(`Playlist information saved to: ${jsonFilePath}`))
      return
    }

    // Process each video in the playlist
    for (const [index, url] of urls.entries()) {
      log(opts(`\n================================================================================================`))
      log(opts(`  Processing video ${index + 1}/${urls.length}: ${url}`))
      log(opts(`================================================================================================\n`))
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        console.error(`Error processing video ${url}: ${(error as Error).message}`)
        // Continue processing the next video
      }
    }
  } catch (error) {
    console.error(`Error processing playlist: ${(error as Error).message}`)
    process.exit(1) // Exit with an error code
  }
}