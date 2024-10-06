// src/commands/processFile.ts

import { generateFileMarkdown } from '../utils/generateMarkdown.js'
import { downloadFileAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final } from '../types.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Main function to process a local audio or video file.
 * @param {string} filePath - The path to the local file to process.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processFile(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // log(opts(`Options received:\n`))
  // log(options)
  try {
    // Generate markdown for the file
    const { frontMatter, finalPath, filename } = await generateFileMarkdown(filePath)

    // Convert the audio or video file to the required format
    await downloadFileAudio(filePath, filename)

    // Run transcription on the file
    await runTranscription(options, finalPath, frontMatter, transcriptServices)

    // Process the transcript with the selected Language Model
    await runLLM(options, finalPath, frontMatter, llmServices)

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    log(final('\nLocal file processing completed successfully.\n'))
  } catch (error) {
    console.error(`Error processing file: ${(error as Error).message}`)
    process.exit(1) // Exit with an error code
  }
}