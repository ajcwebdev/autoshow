// src/utils/generateMarkdown.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'

const execFilePromise = promisify(execFile)

export async function generateRSSMarkdown(item) {
  try {
    const {
      publishDate, title, coverImage, showLink, channel, channelURL
    } = item
    const sanitizedTitle = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase().slice(0, 200)
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
    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}

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
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 200)
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
    await writeFile(`${finalPath}.md`, frontMatter)
    console.log(`\nInitial markdown file created:\n  - ${finalPath}.md\n\n${frontMatter}`)
    return { frontMatter, finalPath, filename }
  } catch (error) {
    console.error('Error generating markdown:', error)
    throw error
  }
}