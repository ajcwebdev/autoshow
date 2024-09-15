// src/commands/processVideo.js

import { generateMarkdown } from '../utils/generateMarkdown.js'
import { downloadAudio } from '../utils/downloadAudio.js'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

// Define the main function to process a single video
export async function processVideo(url, llmOpt, transcriptionService, options) {
  try {
    // Generate markdown with video metadata
    const { frontMatter, finalPath, filename } = await generateMarkdown(url)

    // Download audio from the video
    await downloadAudio(url, filename)

    // Run transcription on the audio
    await runTranscription(finalPath, transcriptionService, options)

    // Process the transcript with the selected Language Model
    await runLLM(finalPath, frontMatter, llmOpt, options)

    // Clean up temporary files if the noCleanUp option is not set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    // Log any errors that occur during video processing
    console.error('Error processing video:', error)
  }
}