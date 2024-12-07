// src/commands/processChannel.ts

/**
 * @file Processes an entire YouTube channel, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo'
import { l, err, opts, success, execFilePromise, wait } from '../types/globals'
import type { LLMServices, ProcessingOptions, VideoMetadata } from '../types/main'
import type { TranscriptServices } from '../types/transcript-service-types'

/**
 * Validates channel processing options for consistency and correct values.
 * 
 * @param options - Configuration options to validate
 * @throws Will exit process if validation fails
 */
function validateChannelOptions(options: ProcessingOptions): void {
  if (options.last !== undefined) {
    if (!Number.isInteger(options.last) || options.last < 1) {
      err('Error: The --last option must be a positive integer.')
      process.exit(1)
    }
    if (options.skip !== undefined || options.order !== undefined) {
      err('Error: The --last option cannot be used with --skip or --order.')
      process.exit(1)
    }
  }

  if (options.skip !== undefined && (!Number.isInteger(options.skip) || options.skip < 0)) {
    err('Error: The --skip option must be a non-negative integer.')
    process.exit(1)
  }

  if (options.order !== undefined && !['newest', 'oldest'].includes(options.order)) {
    err("Error: The --order option must be either 'newest' or 'oldest'.")
    process.exit(1)
  }
}

/**
 * Logs the current processing action based on provided options.
 * 
 * @param options - Configuration options determining what to process
 */
function logProcessingAction(options: ProcessingOptions): void {
  if (options.last) {
    l(wait(`\nProcessing the last ${options.last} videos`))
  } else if (options.skip) {
    l(wait(`\nSkipping first ${options.skip || 0} videos`))
  }
}

/**
 * Video information including upload date, URL, and type.
 */
interface VideoInfo {
  uploadDate: string
  url: string
  date: Date
  timestamp: number  // Unix timestamp for more precise sorting
  isLive: boolean   // Flag to identify live streams
}

/**
 * Gets detailed video information using yt-dlp.
 * 
 * @param url - Video URL to get information for
 * @returns Promise resolving to video information
 */
async function getVideoDetails(url: string): Promise<VideoInfo | null> {
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
}

/**
 * Selects which videos to process based on provided options.
 * 
 * @param videos - All available videos with their dates and URLs
 * @param options - Configuration options for filtering
 * @returns Array of video info to process
 */
function selectVideosToProcess(videos: VideoInfo[], options: ProcessingOptions): VideoInfo[] {
  if (options.last) {
    return videos.slice(0, options.last)
  }
  return videos.slice(options.skip || 0)
}

/**
 * Logs the processing status and video counts.
 * 
 * @param total - Total number of videos found.
 * @param processing - Number of videos to process.
 * @param options - Configuration options.
 */
function logProcessingStatus(total: number, processing: number, options: ProcessingOptions): void {
  if (options.last) {
    l(wait(`\n  - Found ${total} videos in the channel.`))
    l(wait(`  - Processing the last ${processing} videos.`))
  } else if (options.skip) {
    l(wait(`\n  - Found ${total} videos in the channel.`))
    l(wait(`  - Processing ${processing} videos after skipping ${options.skip || 0}.\n`))
  } else {
    l(wait(`\n  - Found ${total} videos in the channel.`))
    l(wait(`  - Processing all ${processing} videos.\n`))
  }
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
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l(opts('Parameters passed to processChannel:\n'))
  l(opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`))

  try {
    // Validate options
    validateChannelOptions(options)
    logProcessingAction(options)

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

    // Get detailed information for each video
    const videoUrls = stdout.trim().split('\n').filter(Boolean)
    l(opts(`\nFetching detailed information for ${videoUrls.length} videos...`))

    const videoDetailsPromises = videoUrls.map(url => getVideoDetails(url))
    const videoDetailsResults = await Promise.all(videoDetailsPromises)
    const videos = videoDetailsResults.filter((video): video is VideoInfo => video !== null)

    // Exit if no videos were found in the channel
    if (videos.length === 0) {
      err('Error: No videos found in the channel.')
      process.exit(1)
    }

    // Sort videos based on timestamp
    videos.sort((a, b) => a.timestamp - b.timestamp)

    // If order is 'newest' (default), reverse the sorted array
    if (options.order !== 'oldest') {
      videos.reverse()
    }

    l(opts(`\nFound ${videos.length} videos in the channel...`))

    // Select videos to process based on options
    const videosToProcess = selectVideosToProcess(videos, options)
    logProcessingStatus(videos.length, videosToProcess.length, options)

    // If the --info option is provided, extract metadata for selected videos
    if (options.info) {
      // Collect metadata for selected videos in parallel
      const metadataList = await Promise.all(
        videosToProcess.map(async (video) => {
          const url = video.url
          try {
            // Execute yt-dlp command to extract metadata
            const { stdout } = await execFilePromise('yt-dlp', [
              '--restrict-filenames',
              '--print', '%(webpage_url)s',
              '--print', '%(channel)s',
              '--print', '%(uploader_url)s',
              '--print', '%(title)s',
              '--print', '%(upload_date>%Y-%m-%d)s',
              '--print', '%(thumbnail)s',
              url,
            ])

            // Split the output into individual metadata fields
            const [showLink, channel, channelURL, title, publishDate, coverImage] = stdout
              .trim()
              .split('\n')

            // Validate that all required metadata fields are present
            if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
              throw new Error('Incomplete metadata received from yt-dlp.')
            }

            // Return the metadata object
            return {
              showLink,
              channel,
              channelURL,
              title,
              description: '',
              publishDate,
              coverImage,
            } as VideoMetadata
          } catch (error) {
            // Log error but return null to filter out failed extractions
            err(
              `Error extracting metadata for ${url}: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
            return null
          }
        })
      )

      // Filter out any null results due to errors
      const validMetadata = metadataList.filter(
        (metadata): metadata is VideoMetadata => metadata !== null
      )

      // Save metadata to a JSON file
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/channel_info.json'
      await writeFile(jsonFilePath, jsonContent)
      l(success(`Channel information saved to: ${jsonFilePath}`))
      return
    }

    // Process each video sequentially, with error handling for individual videos
    for (const [index, video] of videosToProcess.entries()) {
      const url = video.url
      // Visual separator for each video in the console
      l(opts(`\n================================================================================================`))
      l(opts(`  Processing video ${index + 1}/${videosToProcess.length}: ${url}`))
      l(opts(`================================================================================================\n`))
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