// src/process-commands/file.ts

/**
 * Processes a local audio or video file and now also retrieves the transcription cost and model.
 * Passes that cost and model into runLLM so they can be recorded in the database.
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown.ts'
import { downloadAudio } from '../process-steps/02-download-audio.ts'
import { saveAudio } from '../process-steps/02-download-audio-utils.ts'
import { runTranscription } from '../process-steps/03-run-transcription.ts'
import { selectPrompts } from '../process-steps/04-select-prompt.ts'
import { runLLM } from '../process-steps/05-run-llm.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'

import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

/**
 * Processes a local audio or video file through a series of operations:
 * 1. Generates markdown with file metadata
 * 2. Converts the file to the required audio format
 * 3. Transcribes the audio content
 * 4. Processes the transcript with a language model (if specified)
 * 5. Cleans up temporary files (unless disabled)
 * 
 * Unlike processVideo, this function handles local files and doesn't need
 * to check for external dependencies like yt-dlp.
 * 
 * @param options - Configuration options for processing
 * @param filePath - Path to the local audio or video file to process
 * @param llmServices - Optional language model service to use for processing the transcript
 * @param transcriptServices - Optional transcription service to use for converting audio to text
 * @throws Will terminate the process with exit code 1 if any processing step fails
 * @returns Promise that resolves when all processing is complete
 */
export async function processFile(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processFile', { filePath, llmServices, transcriptServices })

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)

    // Step 2 - Convert to WAV
    await downloadAudio(options, filePath, filename)

    // Step 3 - Transcribe audio, returning transcript and cost
    const { transcript, transcriptionCost, modelId: transcriptionModel } = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Selecting prompt
    const selectedPrompts = await selectPrompts(options)

    // Step 5 - Run LLM with transcription details
    const llmOutput = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata as ShowNoteMetadata,
      llmServices,
      transcriptServices,
      transcriptionModel,
      transcriptionCost
    )

    // Step 6 - Cleanup
    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    l.dim('\n  processFile command completed successfully.')

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: llmOutput || '',
      transcript,
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}