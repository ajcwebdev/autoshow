// src/commands/processURLs.js

import { readFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { resolve } from 'node:path'

// Define the main function to process URLs from a file
export async function processURLs(filePath, llmOpt, transcriptionService, options) {
  try {
    // Log the start of URL processing and resolve the absolute path of the file
    console.log(`Processing URLs from file: ${filePath}`)
    const absolutePath = resolve(filePath)

    // Read and parse the content of the file into an array of URLs
    const content = await readFile(absolutePath, 'utf8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    // Log the number of URLs found
    console.log(`Found ${urls.length} URLs in the file`)

    // Process each URL
    for (const [index, url] of urls.entries()) {
      console.log(`Processing URL ${index + 1}/${urls.length}: ${url}`)
      try {
        // Process individual video
        await processVideo(url, llmOpt, transcriptionService, options)
      } catch (error) {
        // Log any errors that occur during video processing
        console.error(`Error processing URL ${url}:`, error)
      }
    }

    // Log completion of file processing
    console.log('File processing completed')
  } catch (error) {
    // Log any errors that occur during file reading or processing
    console.error(`Error reading or processing file ${filePath}:`, error)
    throw error
  }
}