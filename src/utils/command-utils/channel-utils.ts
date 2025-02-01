// src/utils/channel-utils.ts

import { l, err } from '../logging'

import type { ProcessingOptions } from '../types/step-types'

/**
 * Validates channel processing options for consistency and correct values.
 * Logs the current channel processing action based on provided options.
 * 
 * @param options - Configuration options to validate
 * @throws Will exit the process if validation fails
 */
export function validateChannelOptions(options: ProcessingOptions): void {
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

  if (options.last) {
    l.dim(`\nProcessing the last ${options.last} videos`)
  } else if (options.skip) {
    l.dim(`\nSkipping first ${options.skip || 0} videos`)
  }
}

/**
 * Logs the processing status and video counts for channel downloads.
 * 
 * @param total - Total number of videos found.
 * @param processing - Number of videos to process.
 * @param options - Configuration options.
 */
export function logChannelProcessingStatus(
  total: number,
  processing: number,
  options: ProcessingOptions
): void {
  if (options.last) {
    l.dim(`\n  - Found ${total} videos in the channel.`)
    l.dim(`  - Processing the last ${processing} videos.`)
  } else if (options.skip) {
    l.dim(`\n  - Found ${total} videos in the channel.`)
    l.dim(`  - Processing ${processing} videos after skipping ${options.skip || 0}.\n`)
  } else {
    l.dim(`\n  - Found ${total} videos in the channel.`)
    l.dim(`  - Processing all ${processing} videos.\n`)
  }
}