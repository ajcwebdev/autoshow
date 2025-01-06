// src/process-commands/playlist.ts

/**
 * @file Processes all videos from a YouTube playlist, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { processVideo } from './video'
import { savePlaylistInfo } from '../utils/save-info'
import { execFilePromise } from '../utils/globals/process'
import { l, err, logPlaylistSeparator } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

/**
 * Processes an entire YouTube playlist by:
 * 1. Fetching all video URLs from the playlist using yt-dlp.
 * 2. Optionally extracting metadata for all videos.
 * 3. Processing each video sequentially with error handling.
 *
 * The function continues processing remaining videos even if individual videos fail.
 *
 * @param options - Configuration options for processing.
 * @param playlistUrl - URL of the YouTube playlist to process.
 * @param llmServices - Optional language model service for transcript processing.
 * @param transcriptServices - Optional transcription service for audio conversion.
 * @throws Will terminate the process with exit code 1 if the playlist itself cannot be processed.
 * @returns Promise that resolves when all videos have been processed.
 */
export async function processPlaylist(
  options: ProcessingOptions,
  playlistUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l.opts('Parameters passed to processPlaylist:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`)

  try {
    // Fetch playlist metadata
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      playlistUrl,
    ])

    // Log any warnings from yt-dlp
    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }

    // Parse the JSON output
    const playlistData = JSON.parse(stdout)
    const playlistTitle = playlistData.title
    const entries = playlistData.entries

    // Extract video URLs using entry.id
    const urls = entries.map((entry: any) => `https://www.youtube.com/watch?v=${entry.id}`)

    // Exit if no videos were found in the playlist
    if (urls.length === 0) {
      err('Error: No videos found in the playlist.')
      process.exit(1)
    }

    l.opts(`\nFound ${urls.length} videos in the playlist: ${playlistTitle}...`)

    // If the --info option is provided, save playlist info and return
    if (options.info) {
      await savePlaylistInfo(urls, playlistTitle)
      return
    }

    // Process each video sequentially, with error handling for individual videos
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      logPlaylistSeparator(index, urls.length, url)
      try {
        // Process the video using the existing processVideo function
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        // Log error but continue processing remaining videos
        err(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    // Handle fatal errors that prevent playlist processing
    err(`Error processing playlist: ${(error as Error).message}`)
    process.exit(1)
  }
}