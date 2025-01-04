// src/utils/save-info.ts

import { writeFile } from 'node:fs/promises'
import { execFilePromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { VideoMetadata, VideoInfo, RSSItem } from '../types/process'

/**
 * Sanitizes a title string for use in filenames by:
 * - Removing special characters except spaces and hyphens
 * - Converting spaces and underscores to hyphens
 * - Converting to lowercase
 * - Limiting length to 200 characters
 * 
 * @param {string} title - The title to sanitize.
 * @returns {string} The sanitized title safe for use in filenames.
 * 
 * @example
 * sanitizeTitle('My Video Title! (2024)') // returns 'my-video-title-2024'
 */
export function sanitizeTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')      // Remove all non-word characters except spaces and hyphens
    .trim()                        // Remove leading and trailing whitespace
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with a single hyphen
    .toLowerCase()                 // Convert to lowercase
    .slice(0, 200)                 // Limit the length to 200 characters
}

/**
 * Builds the front matter content string array from the provided metadata object
 * 
 * @param {object} metadata - The metadata object
 * @param {string} metadata.showLink
 * @param {string} metadata.channel
 * @param {string} metadata.channelURL
 * @param {string} metadata.title
 * @param {string} metadata.description
 * @param {string} metadata.publishDate
 * @param {string} metadata.coverImage
 * @returns {string[]} The front matter array
 */
export function buildFrontMatter(metadata: {
  showLink: string
  channel: string
  channelURL: string
  title: string
  description: string
  publishDate: string
  coverImage: string
}): string[] {
  return [
    '---',
    `showLink: "${metadata.showLink}"`,
    `channel: "${metadata.channel}"`,
    `channelURL: "${metadata.channelURL}"`,
    `title: "${metadata.title}"`,
    `description: "${metadata.description}"`,
    `publishDate: "${metadata.publishDate}"`,
    `coverImage: "${metadata.coverImage}"`,
    '---\n',
  ]
}

/**
 * Saves metadata for all videos in the playlist to a JSON file if `--info` is provided.
 * 
 * @param urls - Array of all video URLs in the playlist
 * @param playlistTitle - Title of the YouTube playlist
 * @returns Promise that resolves when the JSON file has been saved
 */
export async function savePlaylistInfo(urls: string[], playlistTitle: string): Promise<void> {
  // Collect metadata for all videos in parallel
  const metadataList = await Promise.all(
    urls.map(async (url: string) => {
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
  const sanitizedTitle = sanitizeTitle(playlistTitle)
  const jsonFilePath = `content/${sanitizedTitle}_info.json`
  await writeFile(jsonFilePath, jsonContent)
  l.success(`Playlist information saved to: ${jsonFilePath}`)
}

/**
 * Saves metadata for all videos in the provided URLs to a JSON file.
 *
 * @param urls - The list of video URLs
 * @returns Promise that resolves when the JSON file is saved
 */
export async function saveURLsInfo(urls: string[]): Promise<void> {
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
}

/**
 * Saves channel info for the selected videos to a JSON file.
 * 
 * @param videosToProcess - The videos selected for processing
 * @throws If metadata extraction fails
 */
export async function saveChannelInfo(videosToProcess: VideoInfo[]): Promise<void> {
  // Collect metadata for selected videos in parallel
  const metadataList = await Promise.all(
    videosToProcess.map(async (video) => {
      const url = video.url
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
  l.success(`Channel information saved to: ${jsonFilePath}`)
}

/**
 * Saves feed information to a JSON file.
 * 
 * @param items - Array of RSS items to save
 * @param channelTitle - The title of the RSS channel
 */
export async function saveRSSFeedInfo(items: RSSItem[], channelTitle: string): Promise<void> {
  const jsonContent = JSON.stringify(items, null, 2)
  const sanitizedTitle = sanitizeTitle(channelTitle)
  const jsonFilePath = `content/${sanitizedTitle}_info.json`
  await writeFile(jsonFilePath, jsonContent)
  l.wait(`RSS feed information saved to: ${jsonFilePath}`)
}