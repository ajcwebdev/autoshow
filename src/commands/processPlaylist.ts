// src/commands/processPlaylist.ts

/**
 * @file Process all videos from a YouTube playlist, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/extractVideoMetadata.js'
import { checkDependencies } from '../utils/checkDependencies.js'
import { log, opts, success, wait } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

// Convert execFile to use promises instead of callbacks
const execFilePromise = promisify(execFile)

/**
 * Processes an entire YouTube playlist by:
 * 1. Validating system dependencies
 * 2. Fetching all video URLs from the playlist using yt-dlp
 * 3. Extracting metadata for each video
 * 4. Either:
 *    a. Generating a JSON file with playlist information (if --info option is used)
 *    b. Processing each video sequentially with error handling
 * 
 * The function continues processing remaining videos even if individual videos fail.
 * 
 * @param options - Configuration options for processing
 * @param playlistUrl - URL of the YouTube playlist to process
 * @param llmServices - Optional language model service for transcript processing
 * @param transcriptServices - Optional transcription service for audio conversion
 * @throws Will terminate the process with exit code 1 if the playlist itself cannot be processed
 * @returns Promise that resolves when all videos have been processed or JSON info has been saved
 */
export async function processPlaylist(
  options: ProcessingOptions,
  playlistUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  log(opts('Parameters passed to processPlaylist:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`))
  try {
    // Verify that yt-dlp is installed and available
    await checkDependencies(['yt-dlp'])
    // Extract all video URLs from the playlist using yt-dlp
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      playlistUrl
    ])
    // Log any warnings from yt-dlp
    if (stderr) {
      console.error(`yt-dlp warnings: ${stderr}`)
    }
    // Convert stdout into array of video URLs, removing empty entries
    const urls = stdout.trim().split('\n').filter(Boolean)
    // Exit if no videos were found in the playlist
    if (urls.length === 0) {
      console.error('Error: No videos found in the playlist.')
      process.exit(1)
    }
    log(opts(`\nFound ${urls.length} videos in the playlist...`))
    // Collect metadata for all videos in parallel
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)
    // Handle --info option: save metadata to JSON and exit
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/playlist_info.json'
      await writeFile(jsonFilePath, jsonContent)
      log(success(`Playlist information saved to: ${jsonFilePath}`))
      return
    }
    // Process each video sequentially, with error handling for individual videos
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      log(opts(`\n================================================================================================`))
      log(opts(`  Processing video ${index + 1}/${urls.length}: ${url}`))
      log(opts(`================================================================================================\n`))
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        // Log error but continue processing remaining videos
        console.error(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    // Handle fatal errors that prevent playlist processing
    console.error(`Error processing playlist: ${(error as Error).message}`)
    process.exit(1)
  }
}