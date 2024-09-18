// src/commands/processFile.js

import { basename } from 'node:path'
import { downloadFileAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

/**
 * Main function to process a local audio or video file.
 * @param {string} filePath - The path to the local file to process.
 * @param {string} llmOpt - The selected Language Model option.
 * @param {string} transcriptionService - The transcription service to use.
 * @param {object} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processFile(filePath, llmOpt, transcriptionService, options) {
  try {
    // Download or convert the audio file and create frontmatter for markdown file
    const finalPath = await downloadFileAudio(filePath)
    const frontMatter = `---\ntitle: "${basename(filePath)}"\n---\n`

    // Run transcription on the file and process the transcript with the selected LLM
    await runTranscription(finalPath, transcriptionService, options, frontMatter)
    await runLLM(finalPath, frontMatter, llmOpt, options)

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    // Log completion message
    console.log('File processing completed')
  } catch (error) {
    // Log any errors that occur during processing
    console.error('Error processing file:', error)
    throw error
  }
}