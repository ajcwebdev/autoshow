// commands/processUrlsFile.js

import fs from 'fs'
import { processVideo } from './processVideo.js'

export async function processUrlsFile(filePath, model) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  const urls = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)
  for (const url of urls) {
    await processVideo(url, model)
  }
}