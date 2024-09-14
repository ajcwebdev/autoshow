// src/commands/processFile.js

import { basename } from 'node:path'
import { downloadFileAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

export async function processFile(filePath, llmOpt, transcriptionService, options) {
  try {
    const finalPath = await downloadFileAudio(filePath)
    const frontMatter = `---\ntitle: "${basename(filePath)}"\n---\n`
    await runTranscription(finalPath, transcriptionService, options, frontMatter)
    await runLLM(finalPath, frontMatter, llmOpt, options)
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
    console.log('File processing completed')
  } catch (error) {
    console.error('Error processing file:', error)
    throw error
  }
}