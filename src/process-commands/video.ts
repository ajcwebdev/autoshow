// src/process-commands/video.ts

/**
 * @file Process a single video from YouTube or other supported platforms.
 * @packageDocumentation
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { selectPrompts } from '../process-steps/04-select-prompt'
import { runLLM } from '../process-steps/05-run-llm'
import { cleanUpFiles } from '../process-steps/06-clean-up-files'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

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
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<{
  frontMatter: string
  prompt: string
  llmOutput: string
  transcript: string
}> {
  // Log function inputs
  l.opts('processVideo called with the following arguments:\n')
  l.opts(`  - url: ${url}`)
  l.opts(`  - llmServices: ${llmServices}`)
  l.opts(`  - transcriptServices: ${transcriptServices}\n`)

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
      metadata,
      llmServices
    )

    // Step 6 - Cleanup
    if (!options.saveAudio) {
      await cleanUpFiles(finalPath)
    }

    l.wait('\n  processVideo command completed successfully.')

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