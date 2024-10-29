// src/utils/generateMarkdown.ts

/**
 * @file Utility for generating markdown files with front matter for different content types.
 * Supports YouTube videos, playlists, local files, and RSS feed items.
 * @packageDocumentation
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { checkDependencies } from './checkDependencies.js'
import { log, dim, step, success } from '../models.js'
import type { MarkdownData, ProcessingOptions, RSSItem } from '../types.js'

// Promisify the execFile function for use with async/await
const execFilePromise = promisify(execFile)

/**
 * Generates markdown content with front matter based on the provided options and input.
 * Handles different content types including YouTube videos, playlists, local files, and RSS items.
 * 
 * The function performs the following steps:
 * 1. Sanitizes input titles for safe filename creation
 * 2. Extracts metadata based on content type
 * 3. Generates appropriate front matter
 * 4. Creates and saves the markdown file
 * 
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 *                                     Valid options include: video, playlist, urls, file, and rss.
 * @param {string | RSSItem} input - The input data to process:
 *                                   - For video/playlist/urls: A URL string
 *                                   - For file: A file path string
 *                                   - For RSS: An RSSItem object containing feed item details
 * @returns {Promise<MarkdownData>} A promise that resolves to an object containing:
 *                                 - frontMatter: The generated front matter content
 *                                 - finalPath: The path where the markdown file is saved
 *                                 - filename: The sanitized filename
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
  function sanitizeTitle(title: string): string {
    return title
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
      .trim()                   // Remove leading and trailing whitespace
      .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with a single hyphen
      .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
      .toLowerCase()            // Convert to lowercase
      .slice(0, 200)            // Limit to 200 characters
  }

  // Declare variables to store generated content
  let frontMatter: string[]
  let finalPath: string
  let filename: string

  // Handle different content types using a switch statement
  switch (true) {
    case !!options.video:
    case !!options.playlist:
    case !!options.urls:
      // Verify yt-dlp is available for video processing
      await checkDependencies(['yt-dlp'])

      // Extract video metadata using yt-dlp
      const { stdout } = await execFilePromise('yt-dlp', [
        '--restrict-filenames',
        '--print', '%(upload_date>%Y-%m-%d)s',  // Format: YYYY-MM-DD
        '--print', '%(title)s',
        '--print', '%(thumbnail)s',
        '--print', '%(webpage_url)s',
        '--print', '%(channel)s',
        '--print', '%(uploader_url)s',
        input as string,
      ])

      // Parse the metadata output into individual fields
      const [
        formattedDate, videoTitle, thumbnail, webpage_url, videoChannel, uploader_url
      ] = stdout.trim().split('\n')

      // Generate filename using date and sanitized title
      filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
      finalPath = `content/${filename}`

      // Create video-specific front matter
      frontMatter = [
        '---',
        `showLink: "${webpage_url}"`,
        `channel: "${videoChannel}"`,
        `channelURL: "${uploader_url}"`,
        `title: "${videoTitle}"`,
        `description: ""`,
        `publishDate: "${formattedDate}"`,
        `coverImage: "${thumbnail}"`,
        '---\n',
      ]
      break

    case !!options.file:
      // Extract and process local file information
      const originalFilename = basename(input as string)
      const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')

      // Generate sanitized filename
      filename = sanitizeTitle(filenameWithoutExt)
      finalPath = `content/${filename}`

      // Create file-specific front matter with minimal metadata
      frontMatter = [
        '---',
        `showLink: "${originalFilename}"`,
        `channel: ""`,
        `channelURL: ""`,
        `title: "${originalFilename}"`,
        `description: ""`,
        `publishDate: ""`,
        `coverImage: ""`,
        '---\n',
      ]
      break

    case !!options.rss:
      // Process RSS feed item
      const item = input as RSSItem
      const { publishDate, title: rssTitle, coverImage, showLink, channel: rssChannel, channelURL } = item

      // Generate filename using date and sanitized title
      filename = `${publishDate}-${sanitizeTitle(rssTitle)}`
      finalPath = `content/${filename}`

      // Create RSS-specific front matter
      frontMatter = [
        '---',
        `showLink: "${showLink}"`,
        `channel: "${rssChannel}"`,
        `channelURL: "${channelURL}"`,
        `title: "${rssTitle}"`,
        `description: ""`,
        `publishDate: "${publishDate}"`,
        `coverImage: "${coverImage}"`,
        '---\n',
      ]
      break

    default:
      throw new Error('Invalid option provided for markdown generation.')
  }

  // Join front matter array into a single string
  const frontMatterContent = frontMatter.join('\n')

  // Write the front matter content to a markdown file
  await writeFile(`${finalPath}.md`, frontMatterContent)

  // Log the generated content and success message
  log(dim(frontMatterContent))
  log(step('\nStep 1 - Generating markdown...\n'))
  log(success(`  Front matter successfully created and saved:\n    - ${finalPath}.md`))

  // Return the generated markdown data for further processing
  return { frontMatter: frontMatterContent, finalPath, filename }
}