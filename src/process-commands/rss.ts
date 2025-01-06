// src/process-commands/rss.ts

/**
 * @file Process podcast episodes and other media content from RSS feeds with robust error handling and filtering options.
 * @packageDocumentation
 */

import { generateMarkdown } from '../process-steps/01-generate-markdown'
import { downloadAudio } from '../process-steps/02-download-audio'
import { runTranscription } from '../process-steps/03-run-transcription'
import { selectPrompts } from '../process-steps/04-select-prompt'
import { runLLM } from '../process-steps/05-run-llm'
import { cleanUpFiles } from '../process-steps/06-clean-up-files'
import { saveRSSFeedInfo } from '../utils/save-info'
import { validateRSSOptions, selectItems } from '../utils/validate-option'
import { l, err, logRSSProcessingAction, logRSSProcessingStatus, logRSSSeparator } from '../utils/logging'
import type { ProcessingOptions, RSSItem } from '../utils/types/process'
import type { TranscriptServices } from '../utils/types/transcription'
import type { LLMServices } from '../utils/types/llms'

/**
 * Processes a single RSS item by generating markdown, downloading audio, transcribing,
 * selecting a prompt, and possibly running an LLM. 
 * 
 * Now returns an object containing frontMatter, the prompt, the LLM output, and transcript.
 * 
 * @param item - A single RSS item to process
 * @param options - Global processing options
 * @param llmServices - Optional LLM services
 * @param transcriptServices - Optional transcription services
 * @returns An object containing frontMatter, prompt, llmOutput, and transcript
 */
export async function processItems(
  item: RSSItem,
  options: ProcessingOptions,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<{
  frontMatter: string
  prompt: string
  llmOutput: string
  transcript: string
}> {
  l.opts('Parameters passed to processItem:\n')
  l.opts(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}\n`)

  try {
    // Step 1 - Generate markdown
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, item)

    // Step 2 - Download audio and convert to WAV
    await downloadAudio(options, item.showLink, filename)

    // Step 3 - Transcribe audio and read transcript
    const transcript = await runTranscription(options, finalPath, transcriptServices)

    // Step 4 - Select Prompt
    const selectedPrompts = await selectPrompts(options)

    // Step 5 - Run LLM (optional)
    // (Adjust return value from runLLM if needed to capture desired data)
    const llmOutput = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata,
      llmServices
    )

    // Clean up downloaded audio if not saving
    if (!options.saveAudio) {
      await cleanUpFiles(finalPath)
    }

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: llmOutput || '',
      transcript,
    }
  } catch (error) {
    err(`Error processing item ${item.title}: ${(error as Error).message}`)
    return {
      frontMatter: '',
      prompt: '',
      llmOutput: '',
      transcript: '',
    }
  }
}

/**
 * Main function to process an RSS feed.
 * See detailed documentation above regarding options and error handling.
 */
export async function processRSS(
  options: ProcessingOptions,
  rssUrl: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
): Promise<void> {
  l.opts('Parameters passed to processRSS:\n')
  l.wait(`  - llmServices: ${llmServices}\n  - transcriptServices: ${transcriptServices}`)

  try {
    validateRSSOptions(options)
    logRSSProcessingAction(options)

    // Combined fetch + filtering now happens in selectItems:
    const { items, channelTitle } = await selectItems(rssUrl, options)

    // If --info, just save and exit
    if (options.info) {
      await saveRSSFeedInfo(items, channelTitle)
      return
    }

    // If no filtered items remain, skip
    if (items.length === 0) {
      l.wait('\nNo items found matching the provided criteria for this feed. Skipping...')
      return
    }

    // Log info about the filter results and process
    logRSSProcessingStatus(items.length, items.length, options)

    const results = []

    for (const [index, item] of items.entries()) {
      logRSSSeparator(index, items.length, item.title)
      const result = await processItems(item, options, llmServices, transcriptServices)
      results.push(result)
    }

  } catch (error) {
    err(`Error processing RSS feed: ${(error as Error).message}`)
    process.exit(1)
  }
}