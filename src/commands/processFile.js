// src/commands/processFile.js

import { generateFileMarkdown } from '../utils/generateMarkdown.js'
import { downloadFileAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final } from '../types.js'

/** @import { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js' */

/**
 * Main function to process a local audio or video file.
 * @param {string} filePath - The path to the local file to process.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processFile(filePath, llmServices, transcriptServices, options) {
  // log(opts(`Options received:\n`))
  // log(options)
  try {
    // Generate markdown for the file
    const { frontMatter, finalPath, filename } = await generateFileMarkdown(filePath)

    // Convert the audio or video file to the required format
    await downloadFileAudio(filePath, filename)

    // Run transcription on the file
    await runTranscription(finalPath, frontMatter, transcriptServices, options)

    // Process the transcript with the selected Language Model
    await runLLM(finalPath, frontMatter, llmServices, options)

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    log(final('\nLocal file processing completed successfully.\n'))
  } catch (error) {
    console.error(`Error processing file: ${error.message}`)
    process.exit(1) // Exit with an error code
  }
}