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
): Promise<{
  frontMatter: string
  prompt: string
  llmOutput: string
  transcript: string
}> {
  // Log function inputs
  l.info('processFile called with the following arguments:')
  l.opts(`  - filePath: ${filePath}`)
  l.opts(`  - llmServices: ${llmServices}`)
  l.opts(`  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)

    // Step 2 - Convert to WAV
    await downloadAudio(options, filePath, filename)

    // Step 3 - Transcribe audio and read transcript
    const transcript = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Selecting prompt
    if (options.customPrompt) {
      l.wait(`\n  Reading custom prompt file:\n    - ${options.customPrompt}`)
    }
    const promptText = await readFile(options.customPrompt || '', 'utf-8').catch(() => {
      return ''
    })

    // Prepare the final prompt
    let generatedPrompt = ''
    if (!promptText) {
      l.wait('\n  No custom prompt text found, importing default prompt generator...')
      const defaultPrompt = await import('../process-steps/04-select-prompt')
      generatedPrompt = await defaultPrompt.generatePrompt(options.prompt, undefined)
      l.wait(`\n  Default prompt generated (length: ${generatedPrompt.length})`)
    } else {
      generatedPrompt = promptText
    }

    // Step 5 - Run LLM (if applicable)
    const llmOutput = await runLLM(
      options,
      finalPath,
      frontMatter,
      llmServices,
      `${generatedPrompt}\n## Transcript\n\n${transcript}`
    )

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
      await cleanUpFiles(finalPath)
      l.wait('\n  Cleanup completed.\n')
    }

    l.wait('  processFile command completed successfully.')

    return {
      frontMatter,
      prompt: generatedPrompt,
      llmOutput: llmOutput || '',
      transcript,
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}