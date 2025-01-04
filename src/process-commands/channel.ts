// src/process-commands/channel.ts

/**
 * @file Processes an entire YouTube channel, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { processVideo } from './video'
import { saveChannelInfo } from '../utils/save-info'
import { execFilePromise } from '../utils/globals'
import { l, err, logChannelProcessingAction, logChannelProcessingStatus, logChannelSeparator } from '../utils/logging'
import { validateChannelOptions, selectVideos } from '../utils/validate-option'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices } from '../types/transcription'
import type { LLMServices } from '../types/llms'

/**
 * Processes an entire YouTube channel by:
 * 1. Fetching all video URLs from the channel using yt-dlp.
 * 2. Optionally extracting metadata for all videos.
 * 3. Processing each video sequentially with error handling.
 *
 * The function continues processing remaining videos even if individual videos fail.
 *
 * @param options - Configuration options for processing.
 * @param channelUrl - URL of the YouTube channel to process.
 * @param llmServices - Optional language model service for transcript processing.
 * @param transcriptServices - Optional transcription service for audio conversion.
 * @throws Will terminate the process with exit code 1 if the channel itself cannot be processed.
 * @returns Promise that resolves when all videos have been processed.
 */
export async function processChannel(
  options: ProcessingOptions,
  channelUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l.opts('Parameters passed to processChannel:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`)

  try {
    // Validate options
    validateChannelOptions(options)
    logChannelProcessingAction(options)

    // Get list of videos from channel
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', '%(url)s',
      '--no-warnings',
      channelUrl,
    ])

    // Log any warnings from yt-dlp
    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }

    const { allVideos, videosToProcess } = await selectVideos(stdout, options)
    logChannelProcessingStatus(allVideos.length, videosToProcess.length, options)

    // If the --info option is provided, save channel info and return
    if (options.info) {
      await saveChannelInfo(videosToProcess)
      return
    }

    // Process each video sequentially, with error handling for individual videos
    for (const [index, video] of videosToProcess.entries()) {
      const url = video.url
      // Visual separator for each video in the console
      logChannelSeparator(index, videosToProcess.length, url)
      try {
        // Process the video using the existing processVideo function
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        // Log error but continue processing remaining videos
        err(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    // Handle fatal errors that prevent channel processing
    err(`Error processing channel: ${(error as Error).message}`)
    process.exit(1)
  }
}