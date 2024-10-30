// src/utils/validateOption.ts

import { exit } from 'node:process'
import { err } from '../globals.js'
import type { ProcessingOptions } from '../types.js'

/**
 * Helper function to validate that only one option from a list is provided.
 * Prevents users from specifying multiple conflicting options simultaneously.
 * 
 * @param optionKeys - The list of option keys to check.
 * @param options - The options object.
 * @param errorMessage - The prefix of the error message.
 * @returns The selected option or undefined.
 */
export function validateOption(
    optionKeys: string[],
    options: ProcessingOptions,
    errorMessage: string
  ): string | undefined {
    // Filter out which options from the provided list are actually set
    const selectedOptions = optionKeys.filter((opt) => options[opt as keyof ProcessingOptions])
    
    // If more than one option is selected, throw an error
    if (selectedOptions.length > 1) {
      err(`Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`)
      exit(1)
    }
    return selectedOptions[0] as string | undefined
  }