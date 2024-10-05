// src/commands/processURLs.js

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/generateMarkdown.js'
import { checkDependencies } from '../utils/checkDependencies.js'
import { log, final, wait } from '../types.js'

/** @import { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js' */

/**
 * Main function to process URLs from a file.
 * @param {string} filePath - The path to the file containing URLs.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processURLs(filePath, llmServices, transcriptServices, options) {
  // log(opts(`Options received:\n`))
  // log(options)
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    const absolutePath = resolve(filePath)

    // Read and parse the content of the file into an array of URLs
    const content = await readFile(absolutePath, 'utf8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    if (urls.length === 0) {
      console.error('Error: No URLs found in the file.')
      process.exit(1) // Exit with an error code
    }

    log(wait(`\n  Found ${urls.length} URLs in the file...`))

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
      log(wait(`\n  Processing URL ${index + 1}/${urls.length}:\n    - ${url}\n`))
      try {
        await processVideo(url, llmServices, transcriptServices, options)
      } catch (error) {
        console.error(`Error processing URL ${url}: ${error.message}`)
        // Continue processing the next URL
      }
    }

    log(final('\nURL file processing completed successfully.'))
  } catch (error) {
    console.error(`Error reading or processing file ${filePath}: ${error.message}`)
    process.exit(1) // Exit with an error code
  }
}