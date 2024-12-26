// src/process-commands/urls.ts

/**
 * @file Processes multiple YouTube videos from a list of URLs stored in a file.
 * @packageDocumentation
 */

import { readFile, writeFile } from 'node:fs/promises'
import { processVideo } from './video'
import { execFilePromise } from '../utils/globals'
import { l, err, logURLsSeparator } from '../utils/logging'
import type { ProcessingOptions, VideoMetadata } from '../types/process'
import type { TranscriptServices } from '../types/transcription'
import type { LLMServices } from '../types/llms'

/**
 * Processes multiple YouTube videos from a file containing URLs by:
 * 1. Reading and parsing URLs from the input file.
 * 2. Optionally extracting metadata for all videos.
 * 3. Processing each video sequentially with error handling.
 *
 * The function continues processing remaining URLs even if individual videos fail.
 *
 * @param options - Configuration options for processing.
 * @param filePath - Path to the file containing video URLs (one per line).
 * @param llmServices - Optional language model service for transcript processing.
 * @param transcriptServices - Optional transcription service for audio conversion.
 * @throws Will terminate the process with exit code 1 if the file cannot be read or contains no valid URLs.
 * @returns Promise that resolves when all videos have been processed or JSON info has been saved.
 */
export async function processURLs(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l.opts('Parameters passed to processURLs:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Read the file and extract valid URLs
    const content = await readFile(filePath, 'utf8')
    const urls = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    // Exit if no valid URLs were found in the file
    if (urls.length === 0) {
      err('Error: No URLs found in the file.')
      process.exit(1)
    }

    l.opts(`\nFound ${urls.length} URLs in the file...`)

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
            const [
              showLink, channel, channelURL, title, publishDate, coverImage
            ] = stdout.trim().split('\n')

            // Validate that all required metadata fields are present
            if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
              throw new Error('Incomplete metadata received from yt-dlp.')
            }

            // Return the metadata object
            return {
              showLink, channel, channelURL, title, description: '', publishDate, coverImage
            } as VideoMetadata
          } catch (error) {
            // Log error but return null to filter out failed extractions
            err(
              `Error extracting metadata for ${url}: ${error instanceof Error ? error.message : String(error)}`
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
      const date = new Date().toISOString().split('T')[0]
      const uniqueId = Date.now()
      const jsonFilePath = `content/urls_info_${date}_${uniqueId}.json`
      await writeFile(jsonFilePath, jsonContent)
      l.wait(`Video information saved to: ${jsonFilePath}`)
      return
    }

    // Process each URL sequentially, with error handling for individual videos
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      logURLsSeparator(index, urls.length, url)
      try {
        // Process the video using the existing processVideo function
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        // Log error but continue processing remaining URLs
        err(`Error processing URL ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    // Handle fatal errors that prevent file processing
    err(`Error reading or processing file ${filePath}: ${(error as Error).message}`)
    process.exit(1)
  }
}