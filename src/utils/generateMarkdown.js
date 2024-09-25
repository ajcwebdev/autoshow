// src/utils/generateMarkdown.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import '../types.js'

// Promisify the execFile function for use with async/await
const execFilePromise = promisify(execFile)

/**
 * Import custom types
 * @typedef {MarkdownData} MarkdownData
 * @typedef {RSSItem} RSSItem
 */

/**
 * Function to generate markdown for RSS feed items.
 * @param {RSSItem} item - The RSS feed item object.
 * @returns {Promise<MarkdownData>} - Returns an object with frontMatter, finalPath, and filename.
 * @throws {Error} - If markdown generation fails.
 */
export async function generateRSSMarkdown(item) {
  try {
    // Destructure the item object
    const { publishDate, title, coverImage, showLink, channel, channelURL } = item

    // Sanitize the title for use in the filename
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase().slice(0, 200)

    // Construct the filename, path, and front matter for the markdown file
    const filename = `${publishDate}-${sanitizedTitle}`
    const finalPath = `content/${filename}`
    const frontMatter = [
      '---',
      `showLink: "${showLink}"`,
      `channel: "${channel}"`,
      `channelURL: "${channelURL}"`,
      `title: "${title}"`,
      `description: ""`,
      `publishDate: "${publishDate}"`,
      `coverImage: "${coverImage}"`,
      '---\n',
    ].join('\n')

    // Write the front matter to the markdown file
    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}

/**
 * Function to generate markdown for local audio or video files.
 * @param {string} filePath - The path to the local file.
 * @returns {Promise<MarkdownData>} - Returns an object with frontMatter, finalPath, and filename.
 * @throws {Error} - If markdown generation fails.
 */
export async function generateFileMarkdown(filePath) {
  try {
    // Extract the original filename from the full file path
    const originalFilename = basename(filePath)

    // Get the file extension
    const fileExtension = extname(originalFilename)

    // Remove the file extension from the original filename
    const filenameWithoutExt = originalFilename.slice(0, -fileExtension.length)

    // Sanitize the filename
    const sanitizedFilename = filenameWithoutExt
      // Replace any character that's not alphanumeric, whitespace, or hyphen with a hyphen
      .replace(/[^\w\s-]/g, '-')
      // Trim whitespace from both ends
      .trim()
      // Replace any sequence of whitespace or underscores with a single hyphen
      .replace(/[\s_]+/g, '-')
      // Replace any sequence of multiple hyphens with a single hyphen
      .replace(/-+/g, '-')
      // Convert to lowercase
      .toLowerCase()
      // Limit the length to 200 characters
      .slice(0, 200)

    // Construct the final path for the markdown file
    const finalPath = `content/${sanitizedFilename}`

    // Create the front matter content for the markdown file
    const frontMatter = [
      '---',
      `showLink: "${originalFilename}"`,
      `channel: ""`,
      `channelURL: ""`,
      `title: "${originalFilename}"`,
      `description: ""`,
      `publishDate: ""`,
      `coverImage: ""`,
      '---\n',
    ].join('\n')

    // Write the front matter to the markdown file
    await writeFile(`${finalPath}.md`, frontMatter)

    // Log the creation of the markdown file
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md`)

    // Return an object with the generated data
    return { frontMatter, finalPath, filename: sanitizedFilename }
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error generating markdown for file:', error)
    // Re-throw the error to be handled by the calling function
    throw error
  }
}

/**
 * Function to generate markdown for YouTube videos.
 * @param {string} url - The URL of the YouTube video.
 * @returns {Promise<MarkdownData>} - An object containing front matter, final path, and filename.
 * @throws {Error} - If markdown generation fails.
 */
export async function generateMarkdown(url) {
  try {
    // Execute yt-dlp to get video information
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--print', '%(upload_date>%Y-%m-%d)s',
      '--print', '%(title)s',
      '--print', '%(thumbnail)s',
      '--print', '%(webpage_url)s',
      '--print', '%(channel)s',
      '--print', '%(uploader_url)s',
      url
    ])

    // Parse the output from yt-dlp
    const [
      formattedDate, title, thumbnail, webpage_url, channel, uploader_url
    ] = stdout.trim().split('\n')

    // Check for undefined variables
    if (!formattedDate || !title || !thumbnail || !webpage_url || !channel || !uploader_url) {
      throw new Error('Missing video metadata from yt-dlp output')
    }

    // Sanitize the title for use in the filename
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 200)

    // Construct the filename, path, and front matter for the markdown file
    const filename = `${formattedDate}-${sanitizedTitle}`
    const finalPath = `content/${filename}`
    const frontMatter = [
      '---',
      `showLink: "${webpage_url}"`,
      `channel: "${channel}"`,
      `channelURL: "${uploader_url}"`,
      `title: "${title}"`,
      `description: ""`,
      `publishDate: "${formattedDate}"`,
      `coverImage: "${thumbnail}"`,
      '---\n',
    ].join('\n')

    // Write the front matter to the markdown file
    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(
      `\nFrontmatter created:\n\n${frontMatter}\nInitial markdown file created:\n  - ${finalPath}.md`
    )
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}