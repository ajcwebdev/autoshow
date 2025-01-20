// src/process-commands/channel.ts

/**
 * @file Processes an entire YouTube channel, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { processVideo } from './video'
import { execFilePromise } from '../utils/globals/process'
import { validateChannelOptions, saveChannelInfo } from '../utils/validate-option'
import { l, err, logSeparator, logChannelProcessingAction, logChannelProcessingStatus, logInitialFunctionCall } from '../utils/logging'

import type { ProcessingOptions, VideoInfo } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

/**
 * Fetches, sorts, and selects which videos to process based on provided options, 
 * including retrieving details for each video via yt-dlp.
 * 
 * @param stdout - The raw output from yt-dlp containing the video URLs
 * @param options - Configuration options for processing
 * @returns A promise resolving to an object containing all fetched videos and the subset of videos selected to process
 */
export async function selectVideos(
  stdout: string,
  options: ProcessingOptions
): Promise<{ allVideos: VideoInfo[], videosToProcess: VideoInfo[] }> {
  // Prepare URLs
  const videoUrls = stdout.trim().split('\n').filter(Boolean)
  l.opts(`\nFetching detailed information for ${videoUrls.length} videos...`)

  // Retrieve video details
  const videoDetailsPromises = videoUrls.map(async (url) => {
    try {
      const { stdout } = await execFilePromise('yt-dlp', [
        '--print', '%(upload_date)s|%(timestamp)s|%(is_live)s|%(webpage_url)s',
        '--no-warnings',
        url,
      ])

      const [uploadDate, timestamp, isLive, videoUrl] = stdout.trim().split('|')

      if (!uploadDate || !timestamp || !videoUrl) {
        throw new Error('Incomplete video information received from yt-dlp')
      }

      // Convert upload date to Date object
      const year = uploadDate.substring(0, 4)
      const month = uploadDate.substring(4, 6)
      const day = uploadDate.substring(6, 8)
      const date = new Date(`${year}-${month}-${day}`)

      return {
        uploadDate,
        url: videoUrl,
        date,
        timestamp: parseInt(timestamp, 10) || date.getTime() / 1000,
        isLive: isLive === 'True'
      }
    } catch (error) {
      err(`Error getting details for video ${url}: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  })

  const videoDetailsResults = await Promise.all(videoDetailsPromises)
  const allVideos = videoDetailsResults.filter((video): video is VideoInfo => video !== null)

  // Exit if no videos were found in the channel
  if (allVideos.length === 0) {
    err('Error: No videos found in the channel.')
    process.exit(1)
  }

  // Sort videos based on timestamp
  allVideos.sort((a, b) => a.timestamp - b.timestamp)

  // If order is 'newest' (default), reverse the sorted array
  if (options.order !== 'oldest') {
    allVideos.reverse()
  }

  l.opts(`\nFound ${allVideos.length} videos in the channel...`)

  // Select videos to process based on options
  let videosToProcess: VideoInfo[]
  if (options.last) {
    videosToProcess = allVideos.slice(0, options.last)
  } else {
    videosToProcess = allVideos.slice(options.skip || 0)
  }

  return { allVideos, videosToProcess }
}

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
) {
  // Log the processing parameters for debugging purposes
  logInitialFunctionCall('processChannel', { llmServices, transcriptServices })

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
      logSeparator({
        type: 'channel',
        index,
        total: videosToProcess.length,
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
    // Handle fatal errors that prevent channel processing
    err(`Error processing channel: ${(error as Error).message}`)
    process.exit(1)
  }
}