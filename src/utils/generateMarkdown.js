// src/utils/generateMarkdown.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'

const execFilePromise = promisify(execFile)

export async function generateMarkdown(url) {
  try {
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
    const [
      formattedDate, title, thumbnail, webpage_url, channel, uploader_url
    ] = stdout.trim().split('\n')
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 200)
    const filename = `${formattedDate}-${sanitizedTitle}`
    const finalPath = join('content', filename)
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