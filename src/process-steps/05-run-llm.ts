// src/process-steps/05-run-llm.ts

/**
 * @file Orchestrator for running Language Model (LLM) processing on transcripts.
 * Handles prompt generation, LLM processing, and file management for multiple LLM services.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises'
import { callOllama } from '../llms/ollama'
import { callChatGPT } from '../llms/chatgpt'
import { callClaude } from '../llms/claude'
import { callGemini } from '../llms/gemini'
import { callCohere } from '../llms/cohere'
import { callMistral } from '../llms/mistral'
import { callFireworks } from '../llms/fireworks'
import { callTogether } from '../llms/together'
import { callGroq } from '../llms/groq'
import { l, err } from '../utils/logging'
import { retryLLMCall } from '../utils/retry'
import type { ProcessingOptions } from '../types/process'
import type { LLMServices, LLMFunction, LLMFunctions } from '../types/llms'

// Map of available LLM service handlers
export const LLM_FUNCTIONS: LLMFunctions = {
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  cohere: callCohere,
  mistral: callMistral,
  fireworks: callFireworks,
  together: callTogether,
  groq: callGroq,
}

/**
 * Processes a transcript using a specified Language Model service.
 * Handles the complete workflow from combining the transcript to generating
 * and saving the final markdown output for multiple LLM services.
 * 
 * The function performs these steps:
 * 1. Combines the transcript with a provided prompt (if any)
 * 2. Processes the content with the selected LLM
 * 3. Saves the results with front matter and transcript or prompt+transcript
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
 * @param {LLMServices} [llmServices] - The LLM service to use
 * @param {string} [prompt] - Optional prompt or instructions to process
 * @param {string} [transcript] - The transcript content
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  llmServices?: LLMServices,
  prompt?: string,
  transcript?: string
): Promise<string> {
  l.step('\nStep 5 - Run LLM on Transcript with Selected Prompt\n')
  l.wait('  runLLM called with arguments:\n')
  l.wait(`    - finalPath: ${finalPath}`)
  l.wait(`    - llmServices: ${llmServices}\n`)
  l.wait(`  frontMatter:\n\n${frontMatter}`)
  l.wait(`  prompt:\n\n${prompt}`)
  l.wait(`  transcript:\n\n${transcript}`)

  try {
    const combinedPrompt = `${prompt || ''}\n${transcript || ''}`

    if (llmServices) {
      l.wait(`\n  Preparing to process with '${llmServices}' Language Model...\n`)

      const llmFunction: LLMFunction = LLM_FUNCTIONS[llmServices]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }

      let showNotes = ''

      await retryLLMCall(
        async () => {
          showNotes = await llmFunction(prompt || '', transcript || '', options[llmServices])
        },
        5,
        5000
      )

      l.wait(`\n  LLM processing completed successfully.\n`)

      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      l.wait(`\n  Writing combined front matter + LLM output + transcript to file:\n    - ${outputFilename}`)
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.wait(`\n  Generated show notes saved to:\n    - ${outputFilename}`)

      return showNotes
    } else {
      l.wait('\n  No LLM selected, skipping processing...')

      const noLLMFile = `${finalPath}-prompt.md`
      l.wait(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${combinedPrompt}`)
      l.wait(`\n  Prompt and transcript saved to:\n    - ${noLLMFile}`)

      return ''
    }
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}