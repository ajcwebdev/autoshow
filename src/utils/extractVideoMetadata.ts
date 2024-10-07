// src/utils/extractVideoMetadata.ts

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { checkDependencies } from './checkDependencies.js'

import type { VideoMetadata } from '../types.js'

const execFilePromise = promisify(execFile)

/**
 * Extract metadata for a single video URL.
 * @param url - The URL of the video.
 * @returns The video metadata.
 */
export async function extractVideoMetadata(url: string): Promise<VideoMetadata> {
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

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

    const [showLink, channel, channelURL, title, publishDate, coverImage] = stdout.trim().split('\n')

    // Ensure all metadata is present
    if (!showLink || !channel || !channelURL || !title || !publishDate || !coverImage) {
      throw new Error('Incomplete metadata received from yt-dlp.')
    }

    return {
      showLink,
      channel,
      channelURL,
      title,
      description: '',
      publishDate,
      coverImage,
    }
  } catch (error) {
    console.error(`Error extracting metadata for ${url}: ${error instanceof Error ? (error as Error).message : String(error)}`)
    throw error
  }
}