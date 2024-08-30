// src/commands/processVideo.js

import { writeFile } from 'node:fs/promises'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

export async function processVideo(url, llmOption, transcriptionOption, options) {
  try {
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)
    await writeFile(`${finalPath}.md`, frontMatter)
    await downloadAudio(url, filename)
    await runTranscription(finalPath, transcriptionOption, options)
    await runLLM(finalPath, frontMatter, llmOption, options)
    await cleanUpFiles(finalPath)
  } catch (error) {
    console.error('Error processing video:', error)
  }
}