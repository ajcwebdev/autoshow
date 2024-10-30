/**
 * @file Utility for extracting metadata from YouTube videos using yt-dlp.
 * Provides functionality to retrieve essential video information such as title,
 * channel, publish date, and thumbnail URL.
 * @packageDocumentation
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { err } from '../globals.js'
import type { VideoMetadata } from '../types.js'

// Promisify execFile for async/await usage with yt-dlp
const execFilePromise = promisify(execFile)

/**
 * Extracts metadata for a single video URL using yt-dlp.
 * 
 * This function performs the following steps:
 * 1. Verifies yt-dlp is installed
 * 2. Executes yt-dlp with specific format strings to extract metadata
 * 3. Parses the output into structured video metadata
 * 4. Validates that all required metadata fields are present
 * 
 * @param {string} url - The URL of the video to extract metadata from.
 *                      Supports YouTube and other platforms compatible with yt-dlp.
 * 
 * @returns {Promise<VideoMetadata>} A promise that resolves to an object containing:
 *   - showLink: Direct URL to the video
 *   - channel: Name of the channel that published the video
 *   - channelURL: URL to the channel's page
 *   - title: Title of the video
 *   - description: Video description (currently returned empty)
 *   - publishDate: Publication date in YYYY-MM-DD format
 *   - coverImage: URL to the video's thumbnail
 * 
 * @throws {Error} If:
 *   - yt-dlp is not installed
 *   - The video URL is invalid
 *   - Any required metadata field is missing
 *   - The yt-dlp command fails
 * 
 * @example
 * try {
 *   const metadata = await extractVideoMetadata('https://www.youtube.com/watch?v=...')
 *   l(metadata.title) // Video title
 *   l(metadata.publishDate) // YYYY-MM-DD
 * } catch (error) {
 *   err('Failed to extract video metadata:', error)
 * }
 */
export async function extractVideoMetadata(url: string): Promise<VideoMetadata> {
  try {
    // Execute yt-dlp with format strings to extract specific metadata fields
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',                // Ensure safe filenames
      '--print', '%(webpage_url)s',          // Direct link to video
      '--print', '%(channel)s',              // Channel name
      '--print', '%(uploader_url)s',         // Channel URL
      '--print', '%(title)s',                // Video title
      '--print', '%(upload_date>%Y-%m-%d)s', // Formatted upload date
      '--print', '%(thumbnail)s',            // Thumbnail URL
      url,
    ])

    // Split stdout into individual metadata fields
    const [
      showLink, channel, channelURL, title, publishDate, coverImage
    ] = stdout.trim().split('\n')

    // Validate that all required metadata fields are present
    if (
      !showLink || !channel || !channelURL || !title || !publishDate || !coverImage
    ) {
      throw new Error('Incomplete metadata received from yt-dlp.')
    }

    // Return structured video metadata
    return {
      showLink,        // Direct URL to the video
      channel,         // Channel name
      channelURL,      // Channel page URL
      title,           // Video title
      description: '', // Empty description to fill in with LLM output
      publishDate,     // Publication date (YYYY-MM-DD)
      coverImage,      // Thumbnail URL
    }
  } catch (error) {
    // Enhanced error handling with type checking
    err(
      `Error extracting metadata for ${url}: ${
        error instanceof Error ? (error as Error).message : String(error)
      }`
    )
    throw error // Re-throw to allow handling by caller
  }
}