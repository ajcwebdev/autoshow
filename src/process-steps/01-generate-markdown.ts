// src/process-steps/01-generate-markdown.ts

/**
 * @file Utility for generating markdown content with front matter for different content types.
 * Supports YouTube videos, playlists, local files, and RSS feed items.
 * @packageDocumentation
 */

import { basename, extname } from 'node:path'
import { execFilePromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { MarkdownData, ProcessingOptions, RSSItem } from '../types/process'

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
 * Generates markdown content with front matter based on the provided options and input.
 * Handles different content types including YouTube videos, playlists, local files, and RSS items.
 * 
 * The function performs the following steps:
 * 1. Sanitizes input titles for safe filename creation
 * 2. Extracts metadata based on content type
 * 3. Generates appropriate front matter
 * 
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 *                                     Valid options include: video, playlist, urls, file, and rss.
 * @param {string | RSSItem} input - The input data to process:
 *                                   - For video/playlist/urls: A URL string
 *                                   - For file: A file path string
 *                                   - For RSS: An RSSItem object containing feed item details
 * @returns {Promise<MarkdownData>} A promise that resolves to an object containing:
 *                                 - frontMatter: The generated front matter content as a string
 *                                 - finalPath: The path (base name) derived for the content
 *                                 - filename: The sanitized filename
 *                                 - metadata: An object containing all metadata fields
 * @throws {Error} If invalid options are provided or if metadata extraction fails.
 * 
 * @example
 * // For a YouTube video
 * const result = await generateMarkdown(
 *   { video: true },
 *   'https://www.youtube.com/watch?v=...'
 * )
 * 
 * @example
 * // For an RSS item
 * const result = await generateMarkdown(
 *   { rss: true },
 *   { 
 *     publishDate: '2024-03-21',
 *     title: 'Episode Title',
 *     coverImage: 'https://...',
 *     showLink: 'https://...',
 *     channel: 'Podcast Name',
 *     channelURL: 'https://...'
 *   }
 * )
 */
export async function generateMarkdown(
  options: ProcessingOptions,
  input: string | RSSItem
): Promise<MarkdownData> {
  // Log function inputs
  l.step('\nStep 1 - Generate Markdown\n')
  l.wait('\n  generateMarkdown input:\n')
  l.wait(`\n${typeof input === 'string' ? input : JSON.stringify(input, null, 2)}\n`)

  let frontMatter: string[]
  let finalPath: string
  let filename: string
  let metadata: {
    showLink: string
    channel: string
    channelURL: string
    title: string
    description: string
    publishDate: string
    coverImage: string
  }

  switch (true) {
    case !!options.video:
    case !!options.playlist:
    case !!options.urls:
    case !!options.channel:
      try {
        const { stdout } = await execFilePromise('yt-dlp', [
          '--restrict-filenames',
          '--print', '%(webpage_url)s',
          '--print', '%(channel)s',
          '--print', '%(uploader_url)s',
          '--print', '%(title)s',
          '--print', '%(upload_date>%Y-%m-%d)s',
          '--print', '%(thumbnail)s',
          input as string,
        ])

        l.wait('\n  Metadata extraction with yt-dlp completed. Parsing output...\n')
        const [
          showLink,
          videoChannel,
          uploader_url,
          videoTitle,
          formattedDate,
          thumbnail,
        ] = stdout.trim().split('\n')

        if (
          !showLink ||
          !videoChannel ||
          !uploader_url ||
          !videoTitle ||
          !formattedDate ||
          !thumbnail
        ) {
          throw new Error('Incomplete metadata received from yt-dlp.')
        }

        filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
        finalPath = `content/${filename}`

        metadata = {
          showLink: showLink,
          channel: videoChannel,
          channelURL: uploader_url,
          title: videoTitle,
          description: '',
          publishDate: formattedDate,
          coverImage: thumbnail,
        }

        frontMatter = [
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
      } catch (error) {
        err(`Error extracting metadata for ${input}: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
      break

    case !!options.file:
      l.wait('\n  Generating markdown for a local file...')
      const originalFilename = basename(input as string)
      const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')
      filename = sanitizeTitle(filenameWithoutExt)
      finalPath = `content/${filename}`

      metadata = {
        showLink: originalFilename,
        channel: '',
        channelURL: '',
        title: originalFilename,
        description: '',
        publishDate: '',
        coverImage: '',
      }

      frontMatter = [
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
      break

    case !!options.rss:
      l.wait('Generating markdown for an RSS item...')
      const item = input as RSSItem
      const {
        publishDate,
        title: rssTitle,
        coverImage,
        showLink,
        channel: rssChannel,
        channelURL,
      } = item

      filename = `${publishDate}-${sanitizeTitle(rssTitle)}`
      finalPath = `content/${filename}`

      metadata = {
        showLink: showLink,
        channel: rssChannel,
        channelURL: channelURL,
        title: rssTitle,
        description: '',
        publishDate: publishDate,
        coverImage: coverImage,
      }

      frontMatter = [
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
      break

    default:
      throw new Error('Invalid option provided for markdown generation.')
  }

  const frontMatterContent = frontMatter.join('\n')

  // Only log front matter; do not write to file here
  l.dim(frontMatterContent)

  // Log return values
  l.wait(`  generateMarkdown returning:\n\n    - finalPath: ${finalPath}\n    - filename: ${filename}\n`)
  return { frontMatter: frontMatterContent, finalPath, filename, metadata }
}