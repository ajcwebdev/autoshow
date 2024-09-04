// src/commands/processURLs.js

import { readFile } from 'node:fs/promises'
import { processVideo } from './processVideo.js'
import { resolve } from 'node:path'

export async function processURLs(filePath, llmOption, transcriptionOption, options) {
  try {
    console.log(`Processing URLs from file: ${filePath}`)
    const absolutePath = resolve(filePath)
    const content = await readFile(absolutePath, 'utf8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
    console.log(`Found ${urls.length} URLs in the file`)
    for (const [index, url] of urls.entries()) {
      console.log(`Processing URL ${index + 1}/${urls.length}: ${url}`)
      try {
        await processVideo(url, llmOption, transcriptionOption, options)
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error)
      }
    }
    console.log('File processing completed')
  } catch (error) {
    console.error(`Error reading or processing file ${filePath}:`, error)
    throw error
  }
}