// src/commands/processChannel.ts

/**
 * @file Processes an entire YouTube channel, handling metadata extraction and individual video processing.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { l, err, opts, success, execFilePromise } from '../globals.js'
import type {
  LLMServices, TranscriptServices, ProcessingOptions, VideoMetadata,
} from '../types.js'

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
    // Extract all video URLs from the channel using yt-dlp
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', 'url',
      '--no-warnings',
      channelUrl,
    ])

    // Log any warnings from yt-dlp
    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }

    // Convert stdout into array of video URLs, removing empty entries
    const urls = stdout.trim().split('\n').filter(Boolean)

    // Exit if no videos were found in the channel
    if (urls.length === 0) {
      err('Error: No videos found in the channel.')
      process.exit(1)
    }

    l(opts(`\nFound ${urls.length} videos in the channel...`))

    // If the --info option is provided, extract metadata for all videos
    if (options.info) {
      // Collect metadata for all videos in parallel
      const metadataList = await Promise.all(
        urls.map(async (url) => {
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
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      l(opts(`\n================================================================================================`))
      l(opts(`  Processing video ${index + 1}/${urls.length}: ${url}`))
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