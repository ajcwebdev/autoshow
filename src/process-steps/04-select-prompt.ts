// src/process-steps/04-select-prompt.ts

import { sections } from '../prompts/sections.ts'
import { err, l, logInitialFunctionCall } from '../utils/logging.ts'
import { readFile } from '../utils/node-utils.ts'
import { PROMPT_CHOICES } from '../../shared/constants.ts'

import type { ProcessingOptions } from '../utils/types.ts'

const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))

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
    try {
      customPrompt = (await readFile(options.customPrompt, 'utf8')).trim()
    } catch (error) {
      err(`Error reading custom prompt file: ${(error as Error).message}`)
    }
  }

  if (customPrompt) {
    return customPrompt
  }

  let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"

  const prompt = options.printPrompt || options.prompt || ['summary', 'longChapters']

  const validSections = prompt.filter(
    (section): section is keyof typeof sections => 
      validPromptValues.has(section) && Object.hasOwn(sections, section)
  )

  l.dim(`${JSON.stringify(validSections, null, 2)}`)

  validSections.forEach((section) => {
    text += sections[section].instruction + "\n"
  })

  text += "Format the output like so:\n\n"
  validSections.forEach((section) => {
    text += `    ${sections[section].example}\n`
  })

  return text
}