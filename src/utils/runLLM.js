// src/utils/runLLM.js

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

/** @import { LLMOption, ProcessingOptions, LLMFunction, LLMFunctions } from '../types.js' */

/** @type {LLMFunctions} */
const llmFunctions = {
  llama: callLlama,
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  cohere: callCohere,
  mistral: callMistral,
  octo: callOcto,
}

/**
 * Main function to run the selected Language Model.
 * @param {string} finalPath - The base path for the files.
 * @param {string} frontMatter - The front matter content for the markdown file.
 * @param {LLMOption} llmOpt - The selected Language Model option.
 * @param {ProcessingOptions} options - Additional options for processing.
 * @returns {Promise<void>}
 * @throws {Error} - If the LLM processing fails or an error occurs during execution.
 */
export async function runLLM(finalPath, frontMatter, llmOpt, options) {
  try {
    // Read the transcript file, generate the prompt, and combine it with the transcript
    const tempTranscript = await readFile(`${finalPath}.txt`, 'utf8')
    const transcript = `## Transcript\n\n${tempTranscript}`
    const promptAndTranscript = `${generatePrompt(options.prompt)}${transcript}`
    
    if (llmOpt) {
    /** Get the appropriate LLM function based on the option
      * @type {LLMFunction}
      */
      const llmFunction = llmFunctions[llmOpt]
      if (!llmFunction) throw new Error(`Invalid LLM option: ${llmOpt}`)
      
      // Set up a temporary file path and call the LLM function
      const tempPath = `${finalPath}-${llmOpt}-temp.md`
      await llmFunction(promptAndTranscript, tempPath, options[llmOpt])
      
      // Read generated content and write frontmatter, show notes, and transcript to final markdown file
      const showNotes = await readFile(tempPath, 'utf8')
      await writeFile(`${finalPath}-${llmOpt}-shownotes.md`, `${frontMatter}\n${showNotes}\n${transcript}`)
      
      // Remove the temporary file
      await unlink(tempPath)
      console.log(`Updated markdown file:\n  - ${finalPath}-${llmOpt}-shownotes.md`)
    } else {
      // If no LLM is selected, just write the prompt and transcript
      await writeFile(`${finalPath}-prompt.md`, `${frontMatter}\n${promptAndTranscript}`)
      console.log(`\nFinal markdown file with prompt:\n  - ${finalPath}-prompt.md`)
    }
  } catch (error) {
    console.error('Error running LLM:', error)
    throw error
  }
}