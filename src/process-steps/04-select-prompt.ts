// src/process-steps/04-select-prompt.ts

import { readFile } from 'fs/promises'
import { sections } from '../utils/step-utils/prompts'
import { err, l, logInitialFunctionCall } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/step-types'

/**
 * Generates a prompt by combining instructions and examples based on requested sections
 * or uses a custom prompt if provided. If a custom prompt file path is provided,
 * it will be read from a markdown file and returned directly.
 * 
 * @param {ProcessingOptions} options - The processing options containing customPrompt and prompt
 * @returns {Promise<string>} The generated prompt text
 * @throws {Error} If the file cannot be read or is invalid
 */
export async function selectPrompts(options: ProcessingOptions) {
  l.step(`\nStep 4 - Select Prompts\n`)
  logInitialFunctionCall('selectPrompts', { options })

  let customPrompt = ''
  if (options.customPrompt) {
    l.dim(`\n  Custom prompt path provided, attempting to read: ${options.customPrompt}`)

    l.dim('\n  readCustomPrompt called with arguments:\n')
    l.dim(`    - filePath: ${options.customPrompt}`)

    try {
      l.dim(`\n  Reading custom prompt file:\n    - ${options.customPrompt}`)
      const customPromptFileContents = await readFile(options.customPrompt, 'utf8')
      l.dim(`\n  Successfully read custom prompt file, character length:\n\n    - ${customPromptFileContents.length}`)
      customPrompt = customPromptFileContents.trim()
      l.dim('\n  Custom prompt file successfully processed.')
    } catch (error) {
      err(`Error reading custom prompt file: ${(error as Error).message}`)
      customPrompt = ''
    }
  }

  if (customPrompt) {
    return customPrompt
  }

  let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"

  const prompt = options.printPrompt || options.prompt || ['summary', 'longChapters']
  const validSections = prompt.filter((section): section is keyof typeof sections =>
    Object.hasOwn(sections, section)
  )
  l.dim(`${JSON.stringify(validSections, null, 2)}`)

  validSections.forEach((section) => {
    text += sections[section].instruction + "\n"
  })

  text += "Format the output like so:\n\n"
  validSections.forEach((section) => {
    text += `    ${sections[section].example}\n`
  })
  // l.dim(`\n  selectPrompts returning:\n\n${text}`)
  return text
}