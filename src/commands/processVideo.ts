// src/commands/processVideo.ts

import { checkDependencies } from '../utils/checkDependencies.js'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final } from '../types.js'
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
  llmServices?: LLMServices, // Make this optional
  transcriptServices?: TranscriptServices // Make this optional
): Promise<void> {
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Generate markdown with video metadata
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)

    // Download audio from the video
    await downloadAudio(url, filename)

    // Run transcription on the audio if transcriptServices is defined
    if (transcriptServices) {
      await runTranscription(options, finalPath, frontMatter, transcriptServices)
    }

    // Process the transcript with the selected Language Model if llmServices is defined
    if (llmServices) {
      await runLLM(options, finalPath, frontMatter, llmServices)
    }

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    log(final('\nVideo processing completed successfully.\n'))
  } catch (error) {
    // Log any errors that occur during video processing
    console.error('Error processing video:', (error as Error).message)
    throw error // Re-throw to be handled by caller
  }
}