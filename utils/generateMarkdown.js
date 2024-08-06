// utils/generateMarkdown.js

import youtubedl from 'youtube-dl-exec'

export const generateMarkdown = async (url, flags) => {
  const metadata = await youtubedl(url, { dumpSingleJson: true, ...flags })
  const { id: videoId, title, thumbnail, webpage_url, channel, uploader_url, upload_date } = metadata
  const formatted_date = upload_date.length === 8
    ? upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
    : upload_date
  const frontMatter = [
    "---",
    `showLink: "${webpage_url}"`,
    `channel: "${channel}"`,
    `channelURL: "${uploader_url}"`,
    `title: "${title}"`,
    `description: ""`,
    `publishDate: "${formatted_date}"`,
    `coverImage: "${thumbnail}"`,
    "---\n"
  ].join('\n')
  console.log(`\n${frontMatter}\n`)
  const finalPath = `content/${formatted_date}-${videoId}`
  return { frontMatter, finalPath }
}