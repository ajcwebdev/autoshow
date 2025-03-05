// src/process-commands/video.ts

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { saveAudio } from '../process-steps/02-download-audio-utils'
import { runTranscription } from '../process-steps/03-run-transcription'
import { selectPrompts } from '../process-steps/04-select-prompt'
import { runLLM } from '../process-steps/05-run-llm'
import { err, logInitialFunctionCall } from '../utils/logging'

import type { ProcessingOptions, ShowNoteMetadata } from '../utils/types'

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
 * @returns Promise that resolves with { frontMatter, prompt, llmOutput, transcript }
 */
export async function processVideo(
  options: ProcessingOptions,
  url: string,
  llmServices?: string,
  transcriptServices?: string
) {
  // Log the processing parameters for debugging purposes
  logInitialFunctionCall('processVideo', { url, llmServices, transcriptServices })

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, url)

    // Step 2 - Download audio and convert to WAV
    await downloadAudio(options, url, filename)

    // Step 3 - Transcribe audio and read transcript
    const transcript = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Selecting prompt
    const selectedPrompts = await selectPrompts(options)

    // Step 5 - Running LLM processing on transcript (if applicable)...
    const llmOutput = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata as ShowNoteMetadata,
      llmServices
    )

    // Step 6 - Cleanup
    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: llmOutput || '',
      transcript,
    }
  } catch (error) {
    err('Error processing video:', (error as Error).message)
    throw error
  }
}