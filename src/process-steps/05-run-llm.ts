// src/process-steps/05-run-llm.ts

/**
 * @file Orchestrator for running Language Model (LLM) processing on transcripts.
 * Handles prompt generation, LLM processing, and file management for multiple LLM services.
 * @packageDocumentation
 */

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { callOllama } from '../llms/ollama'
import { callChatGPT } from '../llms/chatgpt'
import { callClaude } from '../llms/claude'
import { callGemini } from '../llms/gemini'
import { callCohere } from '../llms/cohere'
import { callMistral } from '../llms/mistral'
import { callFireworks } from '../llms/fireworks'
import { callTogether } from '../llms/together'
import { callGroq } from '../llms/groq'
import { generatePrompt } from './04-select-prompt'
import { l, err } from '../utils/logging'
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
 * Handles the complete workflow from reading the transcript to generating
 * and saving the final markdown output.
 * 
 * The function performs these steps:
 * 1. Reads the transcript file
 * 2. Generates a prompt based on provided options
 * 3. Processes the content with the selected LLM
 * 4. Saves the results with front matter and original transcript
 * 
 * If no LLM is selected, it saves the prompt and transcript without processing.
 * 
 * @param {ProcessingOptions} options - Configuration options including:
 *   - prompt: Array of prompt sections to include
 *   - LLM-specific options (e.g., chatgpt, claude, etc.)
 * 
 * @param {string} finalPath - Base path for input/output files:
 *   - Input transcript: `${finalPath}.txt`
 *   - Temporary file: `${finalPath}-${llmServices}-temp.md`
 *   - Final output: `${finalPath}-${llmServices}-shownotes.md`
 * 
 * @param {string} frontMatter - YAML front matter content to include in the output
 * 
 * @param {LLMServices} [llmServices] - The LLM service to use
 * 
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  llmServices?: LLMServices
): Promise<string> {
  l.wait('\n  runLLM called with arguments:\n')
  l.wait(`    - finalPath: ${finalPath}`)
  l.wait(`    - llmServices: ${llmServices}`)

  try {
    l.wait(`\n  Reading transcript from file:\n    - ${finalPath}.txt`)
    const tempTranscript = await readFile(`${finalPath}.txt`, 'utf8')
    const transcript = `## Transcript\n\n${tempTranscript}`

    l.wait('\n  Generating prompt text using generatePrompt...')
    const prompt = await generatePrompt(options.prompt, options.customPrompt)
    const promptAndTranscript = `${prompt}${transcript}`

    if (llmServices) {
      l.wait(`\n  Preparing to process with '${llmServices}' Language Model...\n`)

      // Get the appropriate LLM handler function
      const llmFunction: LLMFunction = LLM_FUNCTIONS[llmServices]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }

      const maxRetries = 5
      const delayBetweenRetries = 10000 // 10 seconds
      let attempt = 0
      const tempPath = `${finalPath}-${llmServices}-temp.md`

      while (attempt < maxRetries) {
        try {
          attempt++
          l.wait(`  Attempt ${attempt} - Processing with ${llmServices}...\n`)
          await llmFunction(promptAndTranscript, tempPath, options[llmServices])
          l.wait(`\n  LLM call to '${llmServices}' completed successfully on attempt ${attempt}.`)
          break
        } catch (error) {
          err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
          if (attempt >= maxRetries) {
            err(`  Max retries (${maxRetries}) reached. Aborting LLM processing.`)
            throw error
          }
          l.wait(`  Retrying in ${delayBetweenRetries / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries))
        }
      }

      l.wait(`\n  LLM processing completed successfully after ${attempt} attempt(s).\n`)

      l.wait(`\n  Reading LLM output from file:\n    - ${tempPath}`)
      const showNotes = await readFile(tempPath, 'utf8')
      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      l.wait(`\n  Writing combined front matter + LLM output + transcript to file:\n    - ${outputFilename}`)
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n${transcript}`)
      l.wait(`\n  Generated show notes saved to:\n    - ${outputFilename}`)

      l.wait(`\n  Cleaning up temporary file:\n    - ${tempPath}`)
      await unlink(tempPath)
      l.wait('\n  Temporary file removed successfully.\n')

      // Return only the LLM's output portion
      return showNotes
    } else {
      // Handle case when no LLM is selected
      l.wait('\n  No LLM selected, skipping processing...')

      const noLLMFile = `${finalPath}-prompt.md`
      l.wait(`\n  Writing front matter + prompt + transcript to file:\n\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${promptAndTranscript}`)
      l.wait(`\n  Prompt and transcript saved to:\n    - ${noLLMFile}`)

      return ''
    }
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}