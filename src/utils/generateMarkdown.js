// src/utils/generateMarkdown.js

import { checkDependencies } from './checkDependencies.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

/** @import { MarkdownData, RSSItem, VideoMetadata } from '../types.js' */

// Promisify the execFile function for use with async/await
const execFilePromise = promisify(execFile)

/**
 * Extract metadata for a single video URL.
 * @param {string} url - The URL of the video.
 * @returns {Promise<VideoMetadata>} - The video metadata.
 */
export async function extractVideoMetadata(url) {
  console.log('\nStep 0 - Generating metadata...')
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
    console.error(`Error extracting metadata for ${url}: ${error.message}`)
    throw error
  }
}

/**
 * Function to generate markdown for RSS feed items.
 * @param {RSSItem} item - The RSS feed item object.
 * @returns {Promise<MarkdownData>} - Returns an object with frontMatter, finalPath, and filename.
 * @throws {Error} - If markdown generation fails.
 */
export async function generateRSSMarkdown(item) {
  try {
    console.log('\nStep 1 - Generating RSS markdown...')
    // Destructure the item object
    const { publishDate, title, coverImage, showLink, channel, channelURL } = item

    // Sanitize the title for use in the filename
    const sanitizedTitle = sanitizeTitle(title)

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
    console.log(`  - ${finalPath}.md\n  - Front matter successfully created and saved.`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error(`Error generating markdown for RSS item: ${error.message}`)
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
    console.log('\nStep 1 - Generating file markdown...')
    // Extract the original filename from the full file path
    const originalFilename = basename(filePath)

    // Remove the file extension from the original filename
    const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')

    // Sanitize the filename
    const sanitizedFilename = sanitizeTitle(filenameWithoutExt)

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
    console.log(`  - ${finalPath}.md\n  - Front matter successfully created and saved.`)

    // Return an object with the generated data
    return { frontMatter, finalPath, filename: sanitizedFilename }
  } catch (error) {
    // Log any errors that occur during the process
    console.error(`Error generating markdown for file: ${error.message}`)
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
    console.log('\nStep 1 - Generating video markdown...')
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Execute yt-dlp to get video information
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--print', '%(upload_date>%Y-%m-%d)s',
      '--print', '%(title)s',
      '--print', '%(thumbnail)s',
      '--print', '%(webpage_url)s',
      '--print', '%(channel)s',
      '--print', '%(uploader_url)s',
      url,
    ])

    // Parse the output from yt-dlp
    const [
      formattedDate, title, thumbnail, webpage_url, channel, uploader_url
    ] = stdout.trim().split('\n')

    // Ensure all metadata is present
    if (!formattedDate || !title || !thumbnail || !webpage_url || !channel || !uploader_url) {
      throw new Error('Incomplete metadata received from yt-dlp.')
    }

    // Sanitize the title for use in the filename
    const sanitizedTitle = sanitizeTitle(title)

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
    console.log(`  - ${finalPath}.md\n  - Front matter successfully created and saved.`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error(`Error generating markdown for video: ${error.message}`)
    throw error
  }
}

/**
 * Sanitize the title to create a safe filename.
 * @param {string} title - The title to sanitize.
 * @returns {string} - The sanitized title.
 */
function sanitizeTitle(title) {
  return title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 200)
}