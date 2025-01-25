// src/process-commands/channel.ts

/**
 * @file Processes an entire YouTube channel, handling metadata extraction and individual video processing.
 * 
 * @remarks
 * This refactoring makes channel processing structurally similar to RSS processing:
 * 1. Validate top-level flags with {@link validateChannelOptions}.
 * 2. Fetch and parse channel data with yt-dlp.
 * 3. Select and sort items using {@link selectVideos} (analogous to {@link filterRSSItems}).
 * 4. If `--info` is specified, save info and skip.
 * 5. Otherwise, process videos in a loop.
 * 
 * @packageDocumentation
 */

import { processVideo } from './video'
import { execFilePromise } from '../utils/globals/process'
import { validateChannelOptions, saveInfo } from '../utils/validate-option'
import { l, err, logSeparator, logChannelProcessingStatus, logInitialFunctionCall } from '../utils/logging'

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
  const videoUrls = stdout.trim().split('\n').filter(Boolean)
  l.opts(`\nFetching detailed information for ${videoUrls.length} videos...`)

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

  if (allVideos.length === 0) {
    err('Error: No videos found in the channel.')
    process.exit(1)
  }

  allVideos.sort((a, b) => a.timestamp - b.timestamp)

  if (options.order !== 'oldest') {
    allVideos.reverse()
  }

  l.opts(`\nFound ${allVideos.length} videos in the channel...`)

  let videosToProcess: VideoInfo[]
  if (options.last) {
    videosToProcess = allVideos.slice(0, options.last)
  } else {
    videosToProcess = allVideos.slice(options.skip || 0)
  }

  return { allVideos, videosToProcess }
}

/**
 * Processes an entire YouTube channel:
 * 1. Validates top-level flags.
 * 2. Fetches all video URLs via yt-dlp.
 * 3. Uses {@link selectVideos} to gather metadata and filter videos.
 * 4. Logs processing info or saves it if `--info` is specified.
 * 5. Iterates over each video and calls {@link processVideo}.
 * 
 * @param options - Configuration options for processing
 * @param channelUrl - URL of the YouTube channel to process
 * @param llmServices - Optional language model service
 * @param transcriptServices - Optional transcription service
 * @throws Will terminate the process if the channel cannot be processed
 * @returns Promise that resolves when all videos have been processed or info is saved
 */
export async function processChannel(
  options: ProcessingOptions,
  channelUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
) {
  logInitialFunctionCall('processChannel', { llmServices, transcriptServices })
  try {
    validateChannelOptions(options)

    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', '%(url)s',
      '--no-warnings',
      channelUrl,
    ])

    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }

    const { allVideos, videosToProcess } = await selectVideos(stdout, options)
    logChannelProcessingStatus(allVideos.length, videosToProcess.length, options)

    if (options.info) {
      await saveInfo('channel', videosToProcess, '')
      return
    }

    for (const [index, video] of videosToProcess.entries()) {
      const url = video.url
      logSeparator({
        type: 'channel',
        index,
        total: videosToProcess.length,
        descriptor: url
      })

      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        err(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    err(`Error processing channel: ${(error as Error).message}`)
    process.exit(1)
  }
}