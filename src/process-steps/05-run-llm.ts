// src/process-steps/05-run-llm.ts

import { writeFile } from 'node:fs/promises'
import { insertShowNote } from '../db'
import { l, err, logInitialFunctionCall } from '../utils/logging'
import { retryLLMCall } from '../utils/validation/retry'

import type { ProcessingOptions, EpisodeMetadata } from '../utils/types'

import { callOllama } from '../../src/llms/ollama'
import { callChatGPT } from '../../src/llms/chatgpt'
import { callClaude } from '../../src/llms/claude'
import { callGemini } from '../../src/llms/gemini'
import { callDeepSeek } from '../../src/llms/deepseek'
import { callFireworks } from '../../src/llms/fireworks'
import { callTogether } from '../../src/llms/together'

// Map of available LLM service handlers
export const LLM_FUNCTIONS = {
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  deepseek: callDeepSeek,
  fireworks: callFireworks,
  together: callTogether,
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
 * @param {string} [llmServices] - The LLM service to use
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: EpisodeMetadata,
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
      let showNotes = ''

      await retryLLMCall(
        async () => {
          const llmOptions = options[llmServices] ?? ''
          showNotes = await llmFunction(prompt, transcript, llmOptions)
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

    await insertShowNote({
      showLink: metadata.showLink ?? '',
      channel: metadata.channel ?? '',
      channelURL: metadata.channelURL ?? '',
      title: metadata.title ?? '',
      description: metadata.description ?? '',
      publishDate: metadata.publishDate ?? '',
      coverImage: metadata.coverImage ?? '',
      frontmatter: frontMatter,
      prompt,
      transcript,
      llmOutput: showNotesResult
    })

    return showNotesResult
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}