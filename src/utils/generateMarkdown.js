// src/utils/generateMarkdown.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'

// Promisify the execFile function for use with async/await
const execFilePromise = promisify(execFile)

// Function to generate markdown for RSS feed items
export async function generateRSSMarkdown(item) {
  try {
    // Destructure the item object
    const {
      publishDate, title, coverImage, showLink, channel, channelURL
    } = item
    
    // Sanitize the title for use in the filename
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase().slice(0, 200)
    
    // Construct the filename, path, and frontmatter for the markdown file
    const filename = `${publishDate}-${sanitizedTitle}`
    const finalPath = `content/${filename}`
    const frontMatter = [
      "---",
      `showLink: "${showLink}"`,
      `channel: "${channel}"`,
      `channelURL: "${channelURL}"`,
      `title: "${title}"`,
      `description: ""`,
      `publishDate: "${publishDate}"`,
      `coverImage: "${coverImage}"`,
      "---\n"
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

// Function to generate markdown for YouTube videos
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
    
    // Sanitize the title for use in the filename
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 200)
    
    // Construct the filename, path, and frontmatter for the markdown file
    const filename = `${formattedDate}-${sanitizedTitle}`
    const finalPath = `content/${filename}`
    const frontMatter = [
      "---",
      `showLink: "${webpage_url}"`,
      `channel: "${channel}"`,
      `channelURL: "${uploader_url}"`,
      `title: "${title}"`,
      `description: ""`,
      `publishDate: "${formattedDate}"`,
      `coverImage: "${thumbnail}"`,
      "---\n"
    ].join('\n')
    
    // Write the front matter to the markdown file
    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(`\nFrontmatter created:\n\n${frontMatter}\nInitial markdown file created:\n  - ${finalPath}.md`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}