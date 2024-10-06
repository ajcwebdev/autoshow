// src/utils/generateMarkdown.ts

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
 * Generates markdown content based on the provided options and input.
 * 
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 * @param {string | RSSItem} input - The input data, either a string (for video URL or file path) or an RSSItem object.
 * @returns {Promise<MarkdownData>} A promise that resolves to an object containing the generated markdown data.
 * @throws {Error} If invalid options are provided or if metadata extraction fails.
 */
export async function generateMarkdown(
  options: ProcessingOptions,
  input: string | RSSItem
): Promise<MarkdownData> {
  // log(`Options received in generateMarkdown:\n`)
  // log(options)
  // log(`input:`, input)
  /**
   * Sanitizes a title string for use in filenames.
   * 
   * @param {string} title - The title to sanitize.
   * @returns {string} The sanitized title.
   */
  function sanitizeTitle(title: string): string {
    return title
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
      .trim() // Remove leading and trailing whitespace
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with a single hyphen
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .toLowerCase() // Convert to lowercase
      .slice(0, 200) // Limit to 200 characters
  }

  // Declare variables to store generated content
  let frontMatter: string[]
  let finalPath: string
  let filename: string

  // Use a switch statement to handle different content types
  switch (true) {
    case !!options.video:
    case !!options.playlist:
    case !!options.urls:
      // Check if yt-dlp is installed
      await checkDependencies(['yt-dlp'])

      // Execute yt-dlp to extract video metadata
      const { stdout } = await execFilePromise('yt-dlp', [
        '--restrict-filenames',
        '--print', '%(upload_date>%Y-%m-%d)s',
        '--print', '%(title)s',
        '--print', '%(thumbnail)s',
        '--print', '%(webpage_url)s',
        '--print', '%(channel)s',
        '--print', '%(uploader_url)s',
        input as string, // Assert input as string for video URL
      ])

      // Parse the output from yt-dlp
      const [
        formattedDate, videoTitle, thumbnail, webpage_url, videoChannel, uploader_url
      ] = stdout.trim().split('\n')

      // Generate filename and path
      filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
      finalPath = `content/${filename}`

      // Create front matter for video content
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

      // Log progress
      log(step('\nStep 1 - Generating video markdown...\n'))
      break

    case !!options.file:
      // Extract filename from the input path
      const originalFilename = basename(input as string)
      const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')

      // Generate sanitized filename and path
      filename = sanitizeTitle(filenameWithoutExt)
      finalPath = `content/${filename}`

      // Create front matter for file content
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

      // Log progress
      log(step('\nStep 1 - Generating file markdown...\n'))
      break

    case !!options.rss:
      // Assert input as RSSItem and destructure its properties
      const item = input as RSSItem
      const { publishDate, title: rssTitle, coverImage, showLink, channel: rssChannel, channelURL } = item

      // Generate filename and path
      filename = `${publishDate}-${sanitizeTitle(rssTitle)}`
      finalPath = `content/${filename}`

      // Create front matter for RSS content
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

      // Log progress
      log(step('\nStep 1 - Generating RSS markdown...\n'))
      break

    default:
      // Throw an error if an invalid option is provided
      throw new Error('Invalid option provided for markdown generation.')
  }

  // Join the front matter array into a single string
  const frontMatterContent = frontMatter.join('\n')

  // Write the front matter content to a file
  await writeFile(`${finalPath}.md`, frontMatterContent)

  // Log the generated front matter and success message
  log(dim(frontMatterContent))
  log(success(`  Front matter successfully created and saved:\n    - ${finalPath}.md`))

  // Return the generated markdown data
  return { frontMatter: frontMatterContent, finalPath, filename }
}