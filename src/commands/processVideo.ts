// src/commands/processVideo.ts

/**
 * @file Process a single video from YouTube or other supported platforms.
 * @packageDocumentation
 */

import { checkDependencies } from '../utils/checkDependencies.js'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, opts, wait } from '../models.js'
import type { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Processes a single video by executing a series of operations:
 * 1. Validates required system dependencies
 * 2. Generates markdown with video metadata
 * 3. Downloads and extracts audio
 * 4. Transcribes the audio content
 * 5. Processes the transcript with a language model (if specified)
 * 6. Cleans up temporary files (unless disabled)
 * 
 * @param options - Configuration options for processing
 * @param url - The URL of the video to process
 * @param llmServices - Optional language model service to use for processing the transcript
 * @param transcriptServices - Optional transcription service to use for converting audio to text
 * @throws Will throw an error if any processing step fails
 * @returns Promise that resolves when all processing is complete
 */
export async function processVideo(
  options: ProcessingOptions,
  url: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  log(opts('Parameters passed to processVideo:\n'))
  log(wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`))

  try {
    // Verify that required system dependencies (yt-dlp) are installed
    await checkDependencies(['yt-dlp'])

    // Generate markdown file with video metadata and get file paths
    const { frontMatter, finalPath, filename } = await generateMarkdown(options, url)

    // Extract and download the audio from the video source
    await downloadAudio(options, url, filename)

    // Convert the audio to text using the specified transcription service
    await runTranscription(options, finalPath, frontMatter, transcriptServices)

    // Process the transcript with a language model if one was specified
    await runLLM(options, finalPath, frontMatter, llmServices)

    // Remove temporary files unless the noCleanUp option is set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    // Log the error details and re-throw for upstream handling
    console.error('Error processing video:', (error as Error).message)
    throw error
  }
}