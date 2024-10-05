// src/commands/processVideo.js

import { checkDependencies } from '../utils/checkDependencies.js'
import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'
import { log, final } from '../types.js'

/** @import { LLMServices, TranscriptServices, ProcessingOptions } from '../types.js' */

/**
 * Main function to process a single video.
 * @param {string} url - The URL of the video to process.
 * @param {LLMServices} [llmServices] - The selected Language Model option.
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 */
export async function processVideo(url, llmServices, transcriptServices, options) {
  // log(opts(`\nOptions passed to processVideo:\n`))
  // log(options)
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Generate markdown with video metadata
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)

    // Download audio from the video
    await downloadAudio(url, filename)

    // Run transcription on the audio
    await runTranscription(finalPath, frontMatter, transcriptServices, options)

    // Process the transcript with the selected Language Model
    await runLLM(finalPath, frontMatter, llmServices, options)

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }

    log(final('\nVideo processing completed successfully.'))
  } catch (error) {
    // Log any errors that occur during video processing
    console.error('Error processing video:', error.message)
    throw error // Re-throw to be handled by caller
  }
}