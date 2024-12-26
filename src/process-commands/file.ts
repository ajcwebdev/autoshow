// src/process-commands/file.ts

/**
 * @file Process a local audio or video file for transcription and analysis.
 * @packageDocumentation
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { runLLM } from '../process-steps/05-run-llm'
import { cleanUpFiles } from '../process-steps/06-clean-up-files'
import { l, err } from '../utils/logging'
import { readFile } from 'fs/promises'
import { db } from '../server/db'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices } from '../types/transcription'
import type { LLMServices } from '../types/llms'

/**
 * Processes a local audio or video file through a series of operations:
 * 1. Generates markdown with file metadata
 * 2. Converts the file to the required audio format
 * 3. Transcribes the audio content
 * 4. Processes the transcript with a language model (if specified)
 * 5. Saves the show notes into the database
 * 6. Cleans up temporary files (unless disabled)
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
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  // Log the processing parameters for debugging purposes
  l.opts('Parameters passed to processFile:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Generate markdown file with file metadata and get file paths
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)

    // Convert the input file to the required audio format for processing
    await downloadAudio(options, filePath, filename)

    // Convert the audio to text using the specified transcription service
    await runTranscription(options, finalPath, transcriptServices)

    // Process the transcript with a language model if one was specified
    await runLLM(options, finalPath, frontMatter, llmServices)

    // Determine the correct output file path based on whether an LLM was used
    let outputFilePath: string
    if (llmServices) {
      outputFilePath = `${finalPath}-${llmServices}-shownotes.md`
    } else {
      outputFilePath = `${finalPath}-prompt.md`
    }

    // Read the content of the output file
    const content = await readFile(outputFilePath, 'utf-8')

    // Extract title and publishDate from the metadata object
    const { title, publishDate } = metadata

    // Save the show note into the database
    db.prepare(
      `INSERT INTO show_notes (title, date, content) VALUES (?, ?, ?)`
    ).run(title, publishDate, content)

    // Remove temporary files unless the noCleanUp option is set
    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    // Log the error and terminate the process with error code
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}