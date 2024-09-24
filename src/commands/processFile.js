// src/commands/processFile.js

import { generateFileMarkdown } from '../utils/generateMarkdown.js'
import { downloadFileAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

/**
 * Main function to process a local audio or video file.
 * @param {string} filePath - The path to the local file to process.
 * @param {string} llmOpt - The selected Language Model option.
 * @param {string} transcriptOpt - The transcription service to use.
 * @param {object} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processFile(filePath, llmOpt, transcriptOpt, options) {
  try {
    // Generate markdown for the file
    const { frontMatter, finalPath, filename } = await generateFileMarkdown(filePath)

    // Download or convert the audio file
    await downloadFileAudio(filePath, filename)

    // Run transcription on the file and process the transcript with the selected LLM
    await runTranscription(finalPath, transcriptOpt, options, frontMatter)
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