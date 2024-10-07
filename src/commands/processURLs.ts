// src/commands/processURLs.ts

import { readFile, writeFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/extractVideoMetadata.js'
import { checkDependencies } from '../utils/checkDependencies.js'
import { log, wait, opts } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Main function to process URLs from a file.
 * @param filePath - The path to the file containing URLs.
 * @param llmServices - The selected Language Model option.
 * @param transcriptServices - The transcription service to use.
 * @param options - Additional options for processing.
 */
export async function processURLs(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processURLs:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Read and parse the content of the file into an array of URLs
    const content = await readFile(filePath, 'utf8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    if (urls.length === 0) {
      console.error('Error: No URLs found in the file.')
      process.exit(1)
    }
    log(opts(`\n===  Found ${urls.length} URLs in the file...  ===`))

    // Extract metadata for all videos
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)

    // Generate JSON file with video information if --info option is used
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/urls_info.json'
      await writeFile(jsonFilePath, jsonContent)
      log(wait(`Video information saved to: ${jsonFilePath}`))
      return
    }

    // Process each URL
    for (const [index, url] of urls.entries()) {
      log(opts(`\n============================================================`))
      log(opts(`  Processing URL ${index + 1}/${urls.length}: ${url}`))
      log(opts(`============================================================\n`))
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        console.error(`Error processing URL ${url}: ${(error as Error).message}`)
        // Continue processing the next URL
      }
    }
  } catch (error) {
    console.error(`Error reading or processing file ${filePath}: ${(error as Error).message}`)
    process.exit(1) // Exit with an error code
  }
}