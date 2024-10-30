// src/commands/processURLs.ts

/**
 * @file Process multiple YouTube videos from a list of URLs stored in a file.
 * @packageDocumentation
 */

import { readFile, writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/extractVideoMetadata.js'
import { l, err, wait, opts } from '../globals.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Processes multiple YouTube videos from a file containing URLs by:
 * 1. Validating system dependencies
 * 2. Reading and parsing URLs from the input file
 *    - Skips empty lines and comments (lines starting with #)
 * 3. Extracting metadata for all videos
 * 4. Either:
 *    a. Generating a JSON file with video information (if --info option is used)
 *    b. Processing each video sequentially with error handling
 * 
 * Similar to processPlaylist, this function continues processing
 * remaining URLs even if individual videos fail.
 * 
 * @param options - Configuration options for processing
 * @param filePath - Path to the file containing video URLs (one per line)
 * @param llmServices - Optional language model service for transcript processing
 * @param transcriptServices - Optional transcription service for audio conversion
 * @throws Will terminate the process with exit code 1 if the file cannot be read or contains no valid URLs
 * @returns Promise that resolves when all videos have been processed or JSON info has been saved
 */
export async function processURLs(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l(opts('Parameters passed to processURLs:\n'))
  l(opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))

  try {
    // Read the file and extract valid URLs
    const content = await readFile(filePath, 'utf8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
    // Exit if no valid URLs were found in the file
    if (urls.length === 0) {
      err('Error: No URLs found in the file.')
      process.exit(1)
    }
    l(opts(`\nFound ${urls.length} URLs in the file...`))
    // Collect metadata for all videos in parallel
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)
    // Handle --info option: save metadata to JSON and exit
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/urls_info.json'
      await writeFile(jsonFilePath, jsonContent)
      l(wait(`Video information saved to: ${jsonFilePath}`))
      return
    }
    // Process each URL sequentially, with error handling for individual videos
    for (const [index, url] of urls.entries()) {
      // Visual separator for each video in the console
      l(opts(`\n================================================================================================`))
      l(opts(`  Processing URL ${index + 1}/${urls.length}: ${url}`))
      l(opts(`================================================================================================\n`))
      try {
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