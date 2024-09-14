// src/commands/processVideo.js

import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

export async function processVideo(url, llmOpt, transcriptionService, options) {
  try {
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)
    await downloadAudio(url, filename)
    await runTranscription(finalPath, transcriptionService, options)
    await runLLM(finalPath, frontMatter, llmOpt, options)
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    console.error('Error processing video:', error)
  }
}