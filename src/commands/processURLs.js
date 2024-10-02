// src/commands/processURLs.js

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { processVideo } from './processVideo.js'
import { extractVideoMetadata } from '../utils/generateMarkdown.js'
import { checkDependencies } from '../utils/checkDependencies.js'

/** @import { LLMOption, TranscriptOption, ProcessingOptions } from '../types.js' */

/**
 * Main function to process URLs from a file.
 * @param {string} filePath - The path to the file containing URLs.
 * @param {LLMOption} [llmOpt] - The selected Language Model option.
 * @param {TranscriptOption} [transcriptOpt] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processURLs(filePath, llmOpt, transcriptOpt, options) {
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

    console.log(`\nFound ${urls.length} URLs in the file`)

    // Extract metadata for all videos
    const metadataPromises = urls.map(extractVideoMetadata)
    const metadataList = await Promise.all(metadataPromises)
    const validMetadata = metadataList.filter(Boolean)

    // Generate JSON file with video information if --info option is used
    if (options.info) {
      const jsonContent = JSON.stringify(validMetadata, null, 2)
      const jsonFilePath = 'content/urls_info.json'
      await writeFile(jsonFilePath, jsonContent)
      console.log(`Video information saved to: ${jsonFilePath}`)
      return
    }

    // Process each URL
    for (const [index, url] of urls.entries()) {
      console.log(`\nProcessing URL ${index + 1}/${urls.length}: ${url}`)
      try {
        await processVideo(url, llmOpt, transcriptOpt, options)
      } catch (error) {
        console.error(`Error processing URL ${url}: ${error.message}`)
        // Continue processing the next URL
      }
    }

    console.log('\nURL file processing completed successfully.')
  } catch (error) {
    console.error(`Error reading or processing file ${filePath}: ${error.message}`)
    process.exit(1) // Exit with an error code
  }
}