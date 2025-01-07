// src/process-commands/urls.ts

/**
 * @file Processes multiple YouTube videos from a list of URLs stored in a file.
 * @packageDocumentation
 */

import { readFile } from 'node:fs/promises'
import { processVideo } from './video'
import { saveURLsInfo } from '../utils/save-info'
import { l, err, logURLsSeparator } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

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
) {
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
      await saveURLsInfo(urls)
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