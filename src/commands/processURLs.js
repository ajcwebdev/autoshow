// src/commands/processURLs.js

import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { processVideo } from './processVideo.js'

/** @import { LLMOption, TranscriptOption, ProcessingOptions } from '../types.js' */

const execFilePromise = promisify(execFile)

/**
 * Extract metadata for a single video URL.
 * @param {string} url - The URL of the video.
 * @returns {Promise<Object>} - The video metadata.
 */
async function extractVideoMetadata(url) {
  try {
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--print', '%(webpage_url)s',
      '--print', '%(channel)s',
      '--print', '%(uploader_url)s',
      '--print', '%(title)s',
      '--print', '%(upload_date>%Y-%m-%d)s',
      '--print', '%(thumbnail)s',
      url
    ])

    const [showLink, channel, channelURL, title, publishDate, coverImage] = stdout.trim().split('\n')

    return {
      showLink,
      channel,
      channelURL,
      title,
      description: "",
      publishDate,
      coverImage
    }
  } catch (error) {
    console.error(`Error extracting metadata for ${url}:`, error)
    return null
  }
}

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
      console.log(`Processing URL ${index + 1}/${urls.length}: ${url}`)
      try {
        // Process individual video
        await processVideo(url, llmOpt, transcriptOpt, options)
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