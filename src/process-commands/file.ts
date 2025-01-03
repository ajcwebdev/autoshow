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
import { insertShowNote } from '../server/db'
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
  l.opts('Parameters passed to processFile:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)

    // Step 2 - Convert to WAV
    await downloadAudio(options, filePath, filename)

    // Step 3 - Transcribe audio and read transcript
    await runTranscription(options, finalPath, transcriptServices)
    const transcript = await readFile(`${finalPath}.txt`, 'utf-8')

    // Step 4 - Select Prompt
    const promptText = await readFile(options.customPrompt || '', 'utf-8').catch(() => '')

    // Step 5 - Run LLM (optional)
    const llmOutput = await runLLM(options, finalPath, frontMatter, llmServices)

    let generatedPrompt = ''
    if (!promptText) {
      const defaultPrompt = await import('../process-steps/04-select-prompt')
      generatedPrompt = await defaultPrompt.generatePrompt(options.prompt, undefined)
    } else {
      generatedPrompt = promptText
    }

    // Insert into DB
    insertShowNote(
      metadata.showLink ?? '',
      metadata.channel ?? '',
      metadata.channelURL ?? '',
      metadata.title,
      metadata.description ?? '',
      metadata.publishDate,
      metadata.coverImage ?? '',
      frontMatter,
      generatedPrompt,
      transcript,
      llmOutput
    )

    if (!options.noCleanUp) {
      await cleanUpFiles(finalPath)
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}