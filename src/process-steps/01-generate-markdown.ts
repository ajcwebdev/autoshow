// src/process-steps/01-generate-markdown.ts

/**
 * @file Utility for generating markdown files with front matter for different content types.
 * Supports YouTube videos, playlists, local files, and RSS feed items.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
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
 * 4. Creates and saves the markdown file
 * 
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 *                                     Valid options include: video, playlist, urls, file, and rss.
 * @param {string | RSSItem} input - The input data to process:
 *                                   - For video/playlist/urls: A URL string
 *                                   - For file: A file path string
 *                                   - For RSS: An RSSItem object containing feed item details
 * @returns {Promise<MarkdownData>} A promise that resolves to an object containing:
 *                                 - frontMatter: The generated front matter content as a string
 *                                 - finalPath: The path where the markdown file is saved
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
      .replace(/[^\w\s-]/g, '')      // Remove all non-word characters except spaces and hyphens
      .trim()                        // Remove leading and trailing whitespace
      .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-')           // Replace multiple hyphens with a single hyphen
      .toLowerCase()                 // Convert to lowercase
      .slice(0, 200)                 // Limit the length to 200 characters
  }

  // Initialize variables for front matter content, final file path, sanitized filename, and metadata
  let frontMatter: string[]          // Array to hold front matter lines
  let finalPath: string              // The path where the markdown file will be saved
  let filename: string               // The sanitized filename
  let metadata: {                    // Object to hold metadata fields
    showLink: string
    channel: string
    channelURL: string
    title: string
    description: string
    publishDate: string
    coverImage: string
  }

  // Determine which processing option is selected
  switch (true) {
    // If any of these options are true, process as a video
    case !!options.video:
    case !!options.playlist:
    case !!options.urls:
    case !!options.channel:
      try {
        // Execute yt-dlp command to extract metadata
        const { stdout } = await execFilePromise('yt-dlp', [
          '--restrict-filenames',                  // Restrict filenames to ASCII characters
          '--print', '%(webpage_url)s',            // Print the webpage URL
          '--print', '%(channel)s',                // Print the channel name
          '--print', '%(uploader_url)s',           // Print the uploader's URL
          '--print', '%(title)s',                  // Print the video title
          '--print', '%(upload_date>%Y-%m-%d)s',   // Print the upload date in YYYY-MM-DD format
          '--print', '%(thumbnail)s',              // Print the thumbnail URL
          input as string,                         // The video URL provided as input
        ])

        // Split the output into individual metadata fields
        const [
          showLink,          // The video URL
          videoChannel,      // The channel name
          uploader_url,      // The uploader's URL
          videoTitle,        // The video title
          formattedDate,     // The upload date
          thumbnail,         // The thumbnail URL
        ] = stdout.trim().split('\n')

        // Validate that all required metadata fields are present
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

        // Generate the sanitized filename using the upload date and video title
        filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
        // Define the final path where the markdown file will be saved
        finalPath = `content/${filename}`

        // Construct the metadata object
        metadata = {
          showLink: showLink,
          channel: videoChannel,
          channelURL: uploader_url,
          title: videoTitle,
          description: '',
          publishDate: formattedDate,
          coverImage: thumbnail,
        }

        // Construct the front matter content as an array of strings
        frontMatter = [
          '---',
          `showLink: "${metadata.showLink}"`,               // The video URL
          `channel: "${metadata.channel}"`,            // The channel name
          `channelURL: "${metadata.channelURL}"`,         // The uploader's URL
          `title: "${metadata.title}"`,                // The video title
          `description: "${metadata.description}"`,                       // Placeholder for description
          `publishDate: "${metadata.publishDate}"`,       // The upload date
          `coverImage: "${metadata.coverImage}"`,            // The thumbnail URL
          '---\n',
        ]
      } catch (error) {
        // Log the error and rethrow it for upstream handling
        err(`Error extracting metadata for ${input}: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
      break

    // If the file option is selected
    case !!options.file:
      // Get the original filename from the input path
      const originalFilename = basename(input as string)
      // Remove the file extension to get the filename without extension
      const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')

      // Sanitize the filename to make it safe for use in paths
      filename = sanitizeTitle(filenameWithoutExt)
      // Define the final path where the markdown file will be saved
      finalPath = `content/${filename}`

      // Construct the metadata object for a file
      metadata = {
        showLink: originalFilename,
        channel: '',
        channelURL: '',
        title: originalFilename,
        description: '',
        publishDate: '',
        coverImage: '',
      }

      // Construct the front matter content for a file
      frontMatter = [
        '---',
        `showLink: "${metadata.showLink}"`,         // The original filename
        `channel: "${metadata.channel}"`,                             // Empty channel field
        `channelURL: "${metadata.channelURL}"`,                          // Empty channel URL field
        `title: "${metadata.title}"`,            // Use the original filename as the title
        `description: "${metadata.description}"`,                         // Placeholder for description
        `publishDate: "${metadata.publishDate}"`,                         // Empty publish date
        `coverImage: "${metadata.coverImage}"`,                          // Empty cover image
        '---\n',
      ]
      break

    // If the RSS option is selected
    case !!options.rss:
      // Cast the input to an RSSItem type
      const item = input as RSSItem
      // Destructure necessary fields from the RSS item
      const {
        publishDate,         // Publication date
        title: rssTitle,     // Title of the RSS item
        coverImage,          // Cover image URL
        showLink,            // Link to the content
        channel: rssChannel, // Channel name
        channelURL,          // Channel URL
      } = item

      // Generate the sanitized filename using the publish date and title
      filename = `${publishDate}-${sanitizeTitle(rssTitle)}`
      // Define the final path where the markdown file will be saved
      finalPath = `content/${filename}`

      // Construct the metadata object for an RSS item
      metadata = {
        showLink: showLink,
        channel: rssChannel,
        channelURL: channelURL,
        title: rssTitle,
        description: '',
        publishDate: publishDate,
        coverImage: coverImage,
      }

      // Construct the front matter content for an RSS item
      frontMatter = [
        '---',
        `showLink: "${metadata.showLink}"`,                 // Link to the content
        `channel: "${metadata.channel}"`,                // Channel name
        `channelURL: "${metadata.channelURL}"`,             // Channel URL
        `title: "${metadata.title}"`,                    // Title of the RSS item
        `description: "${metadata.description}"`,                         // Placeholder for description
        `publishDate: "${metadata.publishDate}"`,           // Publication date
        `coverImage: "${metadata.coverImage}"`,             // Cover image URL
        '---\n',
      ]
      break

    // If no valid option is provided, throw an error
    default:
      throw new Error('Invalid option provided for markdown generation.')
  }

  // Join the front matter array into a single string with newline separators
  const frontMatterContent = frontMatter.join('\n')

  // Write the front matter content to a markdown file at the specified path
  await writeFile(`${finalPath}.md`, frontMatterContent)

  // Log the front matter content in dimmed text
  l.dim(frontMatterContent)
  // Log the current step in the process
  l.step('\nStep 1 - Generating markdown...\n')
  // Log a success message indicating where the file was saved
  l.success(`  Front matter successfully created and saved:\n    - ${finalPath}.md`)

  // Return an object containing the front matter, final path, filename, and metadata
  return { frontMatter: frontMatterContent, finalPath, filename, metadata }
}