// src/utils/runLLM.ts

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { callLlama } from '../llms/llama.js'
import { callOllama } from '../llms/ollama.js'
import { callChatGPT } from '../llms/chatgpt.js'
import { callClaude } from '../llms/claude.js'
import { callGemini } from '../llms/gemini.js'
import { callCohere } from '../llms/cohere.js'
import { callMistral } from '../llms/mistral.js'
import { callOcto } from '../llms/octo.js'
import { generatePrompt } from '../llms/prompt.js'
import { log, step, success, wait } from '../types.js'
import type { LLMServices, ProcessingOptions, LLMFunction, LLMFunctions } from '../types.js'

/**
 * Main function to run the selected Language Model.
 * @param {string} finalPath - The base path for the files.
 * @param {string} frontMatter - The front matter content for the markdown file.
 * @param {LLMServices} llmServices - The selected Language Model option.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 * @throws {Error} - If the LLM processing fails or an error occurs during execution.
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  llmServices?: LLMServices
): Promise<void> {
  log(step(`\nStep 4 - Running LLM processing on transcript...\n`))
  const LLM_FUNCTIONS: LLMFunctions = {
    llama: callLlama,
    ollama: callOllama,
    chatgpt: callChatGPT,
    claude: callClaude,
    gemini: callGemini,
    cohere: callCohere,
    mistral: callMistral,
    octo: callOcto,
  }

  try {
    // Read the transcript file
    const tempTranscript = await readFile(`${finalPath}.txt`, 'utf8')
    const transcript = `## Transcript\n\n${tempTranscript}`

    // Generate the prompt
    const prompt = generatePrompt(options.prompt)
    const promptAndTranscript = `${prompt}${transcript}`

    if (llmServices) {
      log(wait(`  Processing with ${llmServices} Language Model...`))
      const llmFunction: LLMFunction = LLM_FUNCTIONS[llmServices]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
      // Set up a temporary file path and call the LLM function
      const tempPath = `${finalPath}-${llmServices}-temp.md`
      await llmFunction(promptAndTranscript, tempPath, options[llmServices])
      log(wait(`\n  Transcript saved to temporary file:\n    - ${tempPath}`))
      // Read generated content and write front matter, show notes, and transcript to final markdown file
      const showNotes = await readFile(tempPath, 'utf8')
      await writeFile(`${finalPath}-${llmServices}-shownotes.md`, `${frontMatter}\n${showNotes}\n${transcript}`)
      // Remove the temporary file
      await unlink(tempPath)
      log(success(`\n  Generated show notes saved to markdown file:\n    - ${finalPath}-${llmServices}-shownotes.md`))
    } else {
      log(wait('  No LLM selected, skipping processing...'))
      // If no LLM is selected, just write the prompt and transcript
      await writeFile(`${finalPath}-prompt.md`, `${frontMatter}\n${promptAndTranscript}`)
      log(success(`\n  Prompt and transcript saved to markdown file:\n    - ${finalPath}-prompt.md`))
    }
  } catch (error) {
    console.error(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}