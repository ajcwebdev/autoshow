// src/process-steps/05-run-llm.ts

import { writeFile } from 'node:fs/promises'
import { dbService } from '../db'
import { l, err, logInitialFunctionCall, getModelIdOrDefault } from '../utils/logging'
import { retryLLMCall } from '../utils/validation/retry'
import { LLM_FUNCTIONS } from '../utils/step-utils/05-llm-utils'
import { env } from 'node:process'

import type { ProcessingOptions, ShowNote } from '../utils/types'

/**
 * Processes a transcript using a specified Language Model service.
 * Handles the complete workflow from combining the transcript to generating
 * and saving the final markdown output for multiple LLM services.
 * 
 * The function performs these steps:
 * 1. Combines the transcript with a provided prompt (if any)
 * 2. Processes the content with the selected LLM
 * 3. Saves the results with front matter and transcript or prompt+transcript
 * 4. Inserts show notes into the database (when in server mode only)
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
 * @param {ShowNote} metadata - The metadata object
 * @param {string} [llmServices] - The LLM service to use
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: ShowNote,
  llmServices?: string,
) {
  l.step(`\nStep 5 - Run Language Model\n`)
  logInitialFunctionCall('runLLM', { llmServices, metadata })

  try {
    let showNotesResult = ''
    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const llmFunction = LLM_FUNCTIONS[llmServices as keyof typeof LLM_FUNCTIONS]
    
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
    
      // 1. Pick the actual model name (e.g. 'gpt-4o-mini') from user or default
      const userModel = getModelIdOrDefault(llmServices, options[llmServices])
    
      // 2. Pass that along to the LLM function in your retry block
      let showNotes = ''
      await retryLLMCall<string>(
        async () => {
          showNotes = await llmFunction(prompt, transcript, userModel)
          return showNotes
        },
        5,
        5000
      )

      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.dim(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }

    // Only attempt to insert into the database if we're in server mode
    // This is a double-check to ensure CLI commands don't trigger database access
    if (env['SERVER_MODE'] === 'true') {
      await dbService.insertShowNote({
        showLink: metadata.showLink ?? '',
        channel: metadata.channel ?? '',
        channelURL: metadata.channelURL ?? '',
        title: metadata.title,
        description: metadata.description ?? '',
        publishDate: metadata.publishDate,
        coverImage: metadata.coverImage ?? '',
        frontmatter: frontMatter,
        prompt,
        transcript,
        llmOutput: showNotesResult
      })
    } else {
      l.dim('\n  Skipping database insertion in CLI mode')
    }

    return showNotesResult
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}