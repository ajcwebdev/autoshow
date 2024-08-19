// src/utils/generateMarkdown.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

const generateFilename = async (url) => {
  try {
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--print', '%(upload_date>%Y-%m-%d)s',
      '--print', '%(title)s',
      url
    ])
    const [formattedDate, title] = stdout.trim().split('\n')
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 200)
    return `${formattedDate}-${sanitizedTitle}`
  } catch (error) {
    console.error('Error generating filename:', error)
    throw error
  }
}

export const generateMarkdown = async (url) => {
  try {
    const filename = await generateFilename(url)
    const { stdout } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--print', '%(title)s',
      '--print', '%(thumbnail)s',
      '--print', '%(webpage_url)s',
      '--print', '%(channel)s',
      '--print', '%(uploader_url)s',
      '--print', '%(upload_date>%Y-%m-%d)s',
      url
    ])
    const [
      title, thumbnail, webpage_url, channel, uploader_url, formattedDate
    ] = stdout.trim().split('\n')
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
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md\n\n${frontMatter}`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}