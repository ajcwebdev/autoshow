// src/process-steps/05-run-llm.ts

/**
 * @file Orchestrator for running Language Model (LLM) processing on transcripts.
 * Handles prompt generation, LLM processing, file management for multiple LLM services.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { insertShowNote } from '../server/db'
import { l, err, logInitialFunctionCall } from '../utils/logging'
import { retryLLMCall } from '../utils/retry'
import { LLM_FUNCTIONS } from '../utils/globals/llms'
import type { ProcessingOptions, EpisodeMetadata } from '../utils/types/process'
import type { LLMServices } from '../utils/types/llms'

/**
 * Processes a transcript using a specified Language Model service.
 * Handles the complete workflow from combining the transcript to generating
 * and saving the final markdown output for multiple LLM services.
 * 
 * The function performs these steps:
 * 1. Combines the transcript with a provided prompt (if any)
 * 2. Processes the content with the selected LLM
 * 3. Saves the results with front matter and transcript or prompt+transcript
 * 4. Inserts show notes into the database
 * 
 * If no LLM is selected, it writes the front matter, prompt, and transcript to a file.
 * If an LLM is selected, it writes the front matter, showNotes, and transcript to a file.
 * 
 * @param {ProcessingOptions} options - Configuration options including:
 *   - prompt: Array of prompt sections to include
 *   - LLM-specific options (e.g., chatgpt, claude, etc.)
 * @param {string} finalPath - Base path for input/output files:
 *   - Final output: `${finalPath}-${llmServices}-shownotes.md` (if LLM is used)
 *   - Otherwise: `${finalPath}-prompt.md`
 * @param {string} frontMatter - YAML front matter content to include in the output
 * @param {string} prompt - Optional prompt or instructions to process
 * @param {string} transcript - The transcript content
 * @param {EpisodeMetadata} metadata - The metadata object from generateMarkdown
 * @param {LLMServices} [llmServices] - The LLM service to use
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: EpisodeMetadata,
  llmServices?: LLMServices,
) {
  logInitialFunctionCall('runLLM', { options, finalPath, frontMatter, prompt, transcript, metadata, llmServices })

  try {
    let showNotesResult = ''
    if (llmServices) {
      l.wait(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const llmFunction = LLM_FUNCTIONS[llmServices]

      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
      let showNotes = ''

      await retryLLMCall(
        async () => {
          showNotes = await llmFunction(prompt, transcript, options[llmServices])
        },
        5,
        5000
      )

      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.wait(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      l.wait('\n  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.wait(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }

    insertShowNote(
      metadata.showLink ?? '',
      metadata.channel ?? '',
      metadata.channelURL ?? '',
      metadata.title ?? '',
      metadata.description ?? '',
      metadata.publishDate ?? '',
      metadata.coverImage ?? '',
      frontMatter,
      prompt,
      transcript,
      showNotesResult
    )

    return showNotesResult
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}