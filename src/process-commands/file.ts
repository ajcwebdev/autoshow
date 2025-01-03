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
  // Log function inputs
  l.info('processFile called with the following arguments:')
  l.opts(`  - filePath: ${filePath}`)
  l.opts(`  - llmServices: ${llmServices}`)
  l.opts(`  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    l.step('Step 1 - Generating markdown...')
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)

    // Step 2 - Convert to WAV
    l.step('Step 2 - Converting file to WAV...')
    await downloadAudio(options, filePath, filename)

    // Step 3 - Transcribe audio and read transcript
    l.step('Step 3 - Transcribing audio...')
    const transcript = await runTranscription(options, finalPath, transcriptServices)
    l.wait(`\n  Successfully read transcript file: ${finalPath}.txt (length: ${transcript.length} characters)`)

    // Step 4 - Select Prompt
    l.step('\nStep 4 - Selecting prompt...\n')
    if (options.customPrompt) {
      l.wait(`\n  Reading custom prompt file:\n    - ${options.customPrompt}`)
    }
    const promptText = await readFile(options.customPrompt || '', 'utf-8').catch((err) => {
      l.warn(`  Could not read custom prompt file: ${options.customPrompt}. Using empty prompt. Error: ${err}`)
      return ''
    })
    l.wait(`\n  Prompt text length: ${promptText.length}`)

    // Step 5 - Run LLM (optional)
    l.step('\nStep 5 - Running LLM (if applicable)...')
    const llmOutput = await runLLM(options, finalPath, frontMatter, llmServices)

    let generatedPrompt = ''
    if (!promptText) {
      l.wait('\n  No custom prompt text found, importing default prompt generator...')
      const defaultPrompt = await import('../process-steps/04-select-prompt')
      generatedPrompt = await defaultPrompt.generatePrompt(options.prompt, undefined)
      l.wait(`\n  Default prompt generated (length: ${generatedPrompt.length})`)
    } else {
      generatedPrompt = promptText
    }

    // Insert into DB
    l.wait('\n  Inserting show note into the database...')
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
    l.wait('\n  Show note inserted successfully.\n')

    // Step 6 - Cleanup
    if (!options.noCleanUp) {
      l.step('\nStep 6 - Cleaning up temporary files...')
      await cleanUpFiles(finalPath)
      l.wait('\n  Cleanup completed.\n')
    }

    l.wait('  processFile completed successfully.')
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}