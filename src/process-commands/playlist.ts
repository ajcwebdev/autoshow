// src/process-commands/playlist.ts

import { processVideo } from './video'
import { saveInfo, execFilePromise } from '../utils/validate-option'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/step-types'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

// Parse the JSON output
interface PlaylistEntry {
  id: string;
}

interface PlaylistData {
  title: string;
  entries: PlaylistEntry[];
}

/**
 * Processes an entire YouTube playlist by:
 * 1. Fetching all video URLs from the playlist using yt-dlp.
 * 2. Optionally extracting metadata for all videos.
 * 3. Processing each video sequentially with error handling for individual videos.
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
) {
  // Log the processing parameters for debugging purposes
  logInitialFunctionCall('processPlaylist', { llmServices, transcriptServices })

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

    const playlistData: PlaylistData = JSON.parse(stdout);
    const playlistTitle = playlistData.title;
    const entries: PlaylistEntry[] = playlistData.entries;

    const urls: string[] = entries.map((entry: PlaylistEntry) => `https://www.youtube.com/watch?v=${entry.id}`);

    // Exit if no videos were found in the playlist
    if (urls.length === 0) {
      err('Error: No videos found in the playlist.')
      process.exit(1)
    }

    l.opts(`\nFound ${urls.length} videos in the playlist: ${playlistTitle}...`)

    // If the --info option is provided, save playlist info and return
    if (options.info) {
      await saveInfo('playlist', urls, playlistTitle)
      return
    }

    // Process each video sequentially, with error handling for individual videos
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      logSeparator({
        type: 'playlist',
        index,
        total: urls.length,
        descriptor: url
      })
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