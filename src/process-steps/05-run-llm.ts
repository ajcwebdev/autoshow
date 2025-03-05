// src/process-steps/05-run-llm.ts

import { dbService } from '../db'
import { retryLLMCall } from './05-run-llm-utils'
import { LLM_FUNCTIONS } from './05-run-llm-utils'
import { l, err, logInitialFunctionCall, getModelIdOrDefault } from '../utils/logging'
import { writeFile, env } from '../utils/node-utils'

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

  l(`[runLLM] walletAddress from options: ${options['walletAddress']}`)
  l(`[runLLM] mnemonic from options: ${options['mnemonic']}`)

  metadata.walletAddress = options['walletAddress'] || metadata.walletAddress
  metadata.mnemonic = options['mnemonic'] || metadata.mnemonic

  l(`[runLLM] final metadata.walletAddress: ${metadata.walletAddress}`)
  l(`[runLLM] final metadata.mnemonic: ${metadata.mnemonic}`)

  try {
    let showNotesResult = ''
    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const llmFunction = LLM_FUNCTIONS[llmServices as keyof typeof LLM_FUNCTIONS]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
      const userModel = getModelIdOrDefault(llmServices, options[llmServices])
      let showNotes = ''
      await retryLLMCall<string>(
        async () => {
          showNotes = await llmFunction(prompt, transcript, userModel)
          return showNotes
        }
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
        llmOutput: showNotesResult,
        walletAddress: metadata.walletAddress ?? '',
        mnemonic: metadata.mnemonic ?? ''
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