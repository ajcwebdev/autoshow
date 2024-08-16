// src/commands/processVideo.js

import { writeFile } from 'node:fs/promises'
import {
  generateMarkdown, downloadAudio, runTranscription, runLLM, cleanUpFiles
} from '../utils/exports.js'

export const processVideo = async (url, llmOption, transcriptionOption) => {
  try {
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)
    await writeFile(`${finalPath}.md`, frontMatter)
    await downloadAudio(url, filename)
    await runTranscription(finalPath, transcriptionOption)
    await runLLM(finalPath, frontMatter, llmOption)
    await cleanUpFiles(finalPath)
  } catch (error) {
    console.error('Error processing video:', error)
  }
}