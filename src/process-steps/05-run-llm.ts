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
 * @param {LLMServices} [llmServices] - The LLM service to use:
 *   - ollama: Ollama for local inference
 *   - chatgpt: OpenAI's ChatGPT
 *   - claude: Anthropic's Claude
 *   - gemini: Google's Gemini
 *   - cohere: Cohere
 *   - mistral: Mistral AI
 *   - fireworks: Fireworks AI
 *   - together: Together AI
 *   - groq: Groq
 * 
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 * 
 * @throws {Error} If:
 *   - Transcript file is missing or unreadable
 *   - Invalid LLM service is specified
 *   - LLM processing fails after retries
 *   - File operations fail
 * 
 * @example
 * // Process with Ollama
 * const llmOutput = await runLLM(
 *   { prompt: ['summary', 'highlights'], ollama: 'LLAMA_3_2_1B' },
 *   'content/my-video',
 *   '---\ntitle: My Video\n---',
 *   'chatgpt'
 * )
 * 
 * @example
 * // Save prompt and transcript without LLM processing
 * const llmOutput = await runLLM(
 *   { prompt: ['summary'] },
 *   'content/my-video',
 *   '---\ntitle: My Video\n---'
 * )
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  llmServices?: LLMServices
): Promise<string> {
  l.step(`\nStep 4 - Running LLM processing on transcript...\n`)

  try {
    // Read and format the transcript
    const tempTranscript = await readFile(`${finalPath}.txt`, 'utf8')
    const transcript = `## Transcript\n\n${tempTranscript}`

    // Generate and combine prompt with transcript
    const prompt = await generatePrompt(options.prompt, options.customPrompt)
    const promptAndTranscript = `${prompt}${transcript}`

    if (llmServices) {
      l.wait(`  Preparing to process with ${llmServices} Language Model...\n`)

      // Get the appropriate LLM handler function
      const llmFunction: LLMFunction = LLM_FUNCTIONS[llmServices]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }

      // Set up retry logic
      const maxRetries = 5
      const delayBetweenRetries = 10000 // 10 seconds in milliseconds
      let attempt = 0
      const tempPath = `${finalPath}-${llmServices}-temp.md`

      while (attempt < maxRetries) {
        try {
          attempt++
          l.wait(`  Attempt ${attempt} - Processing with ${llmServices} Language Model...\n`)
          // Process content with selected LLM
          await llmFunction(promptAndTranscript, tempPath, options[llmServices])
          // If successful, break out of the loop
          break
        } catch (error) {
          if (attempt >= maxRetries) {
            err(`  Max retries reached. Unable to process with ${llmServices}.`)
            throw error
          }
          err(`  Attempt ${attempt} failed with error: ${(error as Error).message}`)
          l.wait(`  Retrying in ${delayBetweenRetries / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, delayBetweenRetries))
        }
      }

      l.success(`\n  LLM processing completed successfully after ${attempt} attempt(s).\n`)

      // Combine results with front matter and original transcript
      const showNotes = await readFile(tempPath, 'utf8')
      await writeFile(
        `${finalPath}-${llmServices}-shownotes.md`,
        `${frontMatter}\n${showNotes}\n\n${transcript}`
      )

      // Clean up temporary file
      await unlink(tempPath)
      l.success(`\n  Generated show notes saved to markdown file:\n    - ${finalPath}-${llmServices}-shownotes.md`)

      // Return only the LLM's output portion
      return showNotes
    } else {
      // Handle case when no LLM is selected
      l.wait('  No LLM selected, skipping processing...')
      await writeFile(`${finalPath}-prompt.md`, `${frontMatter}\n${promptAndTranscript}`)
      l.success(`\n  Prompt and transcript saved to markdown file:\n    - ${finalPath}-prompt.md`)
      return ''
    }
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}