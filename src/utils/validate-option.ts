// src/utils/validateOption.ts

import { exit } from 'node:process'
import { err } from '../utils/logging'
import type { ProcessingOptions } from '../types/main'

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
  const selectedOptions = optionKeys.filter((opt) => {
    const value = options[opt as keyof ProcessingOptions]
    if (Array.isArray(value)) {
      // For array options like 'rss', consider it provided only if the array is non-empty
      return value.length > 0
    }
    // Exclude undefined, null, and false values
    return value !== undefined && value !== null && value !== false
  })

  // If more than one option is selected, throw an error
  if (selectedOptions.length > 1) {
    err(`Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`)
    exit(1)
  }
  return selectedOptions[0] as string | undefined
}

/**
 * Validates RSS processing options for consistency and correct values.
 * 
 * @param options - Configuration options to validate
 * @throws Will exit process if validation fails
 */
export function validateRSSOptions(options: ProcessingOptions): void {
  if (options.last !== undefined) {
    if (!Number.isInteger(options.last) || options.last < 1) {
      err('Error: The --last option must be a positive integer.')
      process.exit(1)
    }
    if (options.skip !== undefined || options.order !== undefined) {
      err('Error: The --last option cannot be used with --skip or --order.')
      process.exit(1)
    }
  }

  if (options.skip !== undefined && (!Number.isInteger(options.skip) || options.skip < 0)) {
    err('Error: The --skip option must be a non-negative integer.')
    process.exit(1)
  }

  if (options.order !== undefined && !['newest', 'oldest'].includes(options.order)) {
    err("Error: The --order option must be either 'newest' or 'oldest'.")
    process.exit(1)
  }

  if (options.lastDays !== undefined) {
    if (!Number.isInteger(options.lastDays) || options.lastDays < 1) {
      err('Error: The --lastDays option must be a positive integer.')
      process.exit(1)
    }
    if (options.last !== undefined || options.skip !== undefined || options.order !== undefined || (options.date && options.date.length > 0)) {
      err('Error: The --lastDays option cannot be used with --last, --skip, --order, or --date.')
      process.exit(1)
    }
  }

  if (options.date && options.date.length > 0) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    for (const d of options.date) {
      if (!dateRegex.test(d)) {
        err(`Error: Invalid date format "${d}". Please use YYYY-MM-DD format.`)
        process.exit(1)
      }
    }

    if (options.last !== undefined || options.skip !== undefined || options.order !== undefined) {
      err('Error: The --date option cannot be used with --last, --skip, or --order.')
      process.exit(1)
    }
  }
}