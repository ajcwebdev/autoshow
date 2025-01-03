// src/process-commands/video.ts

/**
 * @file Process a single video from YouTube or other supported platforms.
 * @packageDocumentation
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { runLLM } from '../process-steps/05-run-llm'
import { cleanUpFiles } from '../process-steps/06-clean-up-files'
import { l, err } from '../utils/logging'
import { readFile, writeFile } from 'fs/promises'
import { insertShowNote } from '../server/db'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices } from '../types/transcription'
import type { LLMServices } from '../types/llms'

/**
 * Processes a single video by executing a series of operations:
 * 1. Validates required system dependencies
 * 2. Generates markdown with video metadata
 * 3. Downloads and extracts audio
 * 4. Transcribes the audio content
 * 5. Processes the transcript with a language model (if specified)
 * 6. Saves the show notes into the database
 * 7. Cleans up temporary files (unless disabled)
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
): Promise<string> {
  // Log function inputs
  l.opts('processVideo called with the following arguments:\n')
  l.opts(`  - url: ${url}`)
  l.opts(`  - llmServices: ${llmServices}`)
  l.opts(`  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    l.step('\nStep 1 - Generating markdown...')
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, url)

    // Step 2 - Download audio and convert to WAV
    l.step('\nStep 2 - Downloading/converting audio...\n')
    await downloadAudio(options, url, filename)

    // Step 3 - Transcribe audio and read transcript
    l.step('\nStep 3 - Transcribing audio...\n')
    const transcript = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Select Prompt
    l.step('\nStep 4 - Selecting prompt...\n')
    if (options.customPrompt) {
      l.info(`\n  Reading custom prompt file: ${options.customPrompt}`)
    }
    const promptText = await readFile(options.customPrompt || '', 'utf-8').catch((err) => {
      l.warn(`\n  Could not read custom prompt file: ${options.customPrompt}. Using empty prompt. Error: ${err}`)
      return ''
    })
    l.wait(`\n  Prompt text length: ${promptText.length}`)

    // Step 5 - Run LLM (optional)
    l.step(`\nStep 5 - Running LLM processing on transcript (if applicable)...\n`)
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

    // Write final front matter to a file
    l.wait(`\n  Writing front matter to file:\n    - ${finalPath}.md`)
    await writeFile(`${finalPath}.md`, frontMatter)
    l.wait(`\n  Successfully wrote front matter to file:\n    - ${finalPath}.md\n`)

    // Optional cleanup
    if (!options.noCleanUp) {
      l.step('Step 6 - Cleaning up temporary files...\n')
      await cleanUpFiles(finalPath)
      l.wait('\n  Cleanup completed.\n')
    }

    // Return transcript
    l.wait('  Returning transcript from processVideo...')
    return transcript
  } catch (error) {
    err('Error processing video:', (error as Error).message)
    throw error
  }
}