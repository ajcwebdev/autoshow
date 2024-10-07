// src/commands/processFile.ts

import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, opts, wait } from '../models.js'
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
  log(opts('Parameters passed to processFile:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))
  try {
    const { frontMatter, finalPath, filename } = await generateMarkdown(options, filePath)  // Generate markdown for the file
    await downloadAudio(options, filePath, filename)                                        // Convert the audio or video file to the required format
    await runTranscription(options, finalPath, frontMatter, transcriptServices)             // Run transcription on the file
    await runLLM(options, finalPath, frontMatter, llmServices)                              // Process the transcript with the selected Language Model
    if (!options.noCleanUp) {                                                               // Clean up temporary files if the noCleanUp option is not set
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    console.error(`Error processing file: ${(error as Error).message}`)
    process.exit(1) // Exit with an error code
  }
}