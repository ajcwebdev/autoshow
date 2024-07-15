// utils/index.js

import fs from 'fs'

export const formatDate = dateStr => {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6)}`
  }
  return dateStr
}

export const generateMarkdown = metadata => {
  const { uploader, uploader_url, title, upload_date, webpage_url, thumbnail } = metadata
  const formatted_date = formatDate(upload_date)
  const frontMatter = [
    `showLink: "${webpage_url}"`,
    `channel: "${uploader}"`,
    `channelURL: "${uploader_url}"`,
    `title: "${title}"`,
    `publishDate: "${formatted_date}"`,
    `coverImage: "${thumbnail}"`
  ]
  console.log(frontMatter)
  return frontMatter.join('\n')
}

export function getModel(modelType) {
  switch (modelType) {
    case 'base':
      return "whisper.cpp/models/ggml-base.bin"
    case 'medium':
      return "whisper.cpp/models/ggml-medium.bin"
    case 'large':
      return "whisper.cpp/models/ggml-large-v2.bin"
    // case 'custom':
    //   return "whisper.cpp/models/ggml-base.en.bin"
    default:
      console.error(`Unknown model type: ${modelType}`)
      process.exit(1)
  }
}

export function processLrcToTxt(id) {
  const lrcPath = `${id}.lrc`
  const txtPath = `${id}.txt`
  const lrcContent = fs.readFileSync(lrcPath, 'utf8')
  const txtContent = lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
    .join('\n')
  fs.writeFileSync(txtPath, txtContent)
  console.log(`Transcript file transformed successfully:\n  - ${id}.txt`)
  return txtContent
}

export function concatenateFinalContent(id, txtContent) {
  return [
    fs.readFileSync(`${id}.md`, 'utf8'),
    fs.readFileSync(`./utils/prompt.md`, 'utf8'),
    txtContent
  ].join('\n')
}

export function cleanUpFiles(id) {
  const files = [`${id}.wav`, `${id}.lrc`, `${id}.txt`, `${id}.md`]
  console.log(`\nIntermediate files deleted:`)
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`  - ${file}`)
    }
  }
}