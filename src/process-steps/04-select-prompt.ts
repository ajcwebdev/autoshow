// src/process-steps/04-select-prompt.ts

import { readFile } from 'fs/promises'
import { sections } from '../utils/prompts'
import { err, l } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/process'

/**
 * Reads a custom prompt from a markdown file.
 * @param {string} filePath - Path to the markdown file containing the custom prompt
 * @returns {Promise<string>} The custom prompt text
 * @throws {Error} If the file cannot be read or is invalid
 */
async function readCustomPrompt(filePath: string): Promise<string> {
  l.wait('\n  readCustomPrompt called with arguments:\n')
  l.wait(`    - filePath: ${filePath}`)

  try {
    l.wait(`\n  Reading custom prompt file:\n    - ${filePath}`)
    const customPrompt = await readFile(filePath, 'utf8')
    l.wait(`\n  Successfully read custom prompt file, character length:\n\n    - ${customPrompt.length}`)
    return customPrompt.trim()
  } catch (error) {
    err(`Error reading custom prompt file: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Generates a prompt by combining instructions and examples based on requested sections
 * or uses a custom prompt if provided.
 * @param {ProcessingOptions} options - The processing options containing customPrompt and prompt
 * @returns {Promise<string>} The generated prompt text
 */
export async function selectPrompts(options: ProcessingOptions) {
  l.step('\nStep 4 - Select Prompts\n')
  l.wait('  selectPrompts called with arguments:\n')
  l.wait(`    - prompt: ${JSON.stringify(options.prompt)}`)
  l.wait(`    - customPrompt: ${options.customPrompt || 'none'}`)

  let customPrompt = ''
  if (options.customPrompt) {
    l.wait(`\n  Custom prompt path provided, attempting to read: ${options.customPrompt}`)
    try {
      customPrompt = await readCustomPrompt(options.customPrompt)
      l.wait('\n  Custom prompt file successfully processed.')
    } catch (error) {
      err(`Error loading custom prompt: ${(error as Error).message}`)
      customPrompt = ''
    }
  }

  if (customPrompt) {
    return customPrompt
  }

  // Original prompt generation logic
  let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"

  // Filter valid sections
  const prompt = options.prompt || ['summary', 'longChapters']
  const validSections = prompt.filter((section): section is keyof typeof sections =>
    Object.hasOwn(sections, section)
  )
  l.wait(`\n  Valid sections identified:\n\n    ${JSON.stringify(validSections)}`)

  // Add instructions
  validSections.forEach((section) => {
    text += sections[section].instruction + "\n"
  })

  // Add formatting instructions and examples
  text += "Format the output like so:\n\n"
  validSections.forEach((section) => {
    text += `    ${sections[section].example}\n`
  })
  return text
}