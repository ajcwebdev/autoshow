// src/commands/processVideo.ts

import { checkDependencies } from '../utils/checkDependencies.js'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, opts, wait } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Main function to process a single video.
 * @param url - The URL of the video to process.
 * @param llmServices - The selected Language Model option.
 * @param transcriptServices - The transcription service to use.
 * @param options - Additional options for processing.
 * @returns A promise that resolves when processing is complete.
 */
export async function processVideo(
  options: ProcessingOptions,
  url: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(opts('Parameters passed to processVideo:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))
  try {
    await checkDependencies(['yt-dlp'])                                                // Check for required dependencies.
    const { frontMatter, finalPath, filename } = await generateMarkdown(options, url)  // Generate markdown with video metadata.
    await downloadAudio(options, url, filename)                                        // Download audio from the video.
    await runTranscription(options, finalPath, frontMatter, transcriptServices)        // Run transcription on the audio.
    await runLLM(options, finalPath, frontMatter, llmServices)                         // If llmServices is set, process with LLM. If llmServices is undefined, bypass LLM processing.
    if (!options.noCleanUp) {                                                          // Clean up temporary files if the noCleanUp option is not set.
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    console.error('Error processing video:', (error as Error).message)                 // Log any errors that occur during video processing
    throw error                                                                        // Re-throw to be handled by caller
  }
}