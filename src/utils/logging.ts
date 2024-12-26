// src/utils/logging.ts

import type { ProcessingOptions } from '../types/process'
import chalk from 'chalk'

/**
 * Interface for chainable logger with style methods.
 */
export interface ChainableLogger {
  (...args: any[]): void
  step: (...args: any[]) => void
  dim: (...args: any[]) => void
  success: (...args: any[]) => void
  opts: (...args: any[]) => void
  wait: (...args: any[]) => void
  final: (...args: any[]) => void
}

/**
 * Creates a chainable logger function that maintains both function call and method syntax.
 *
 * @returns A chainable logger instance with styled methods.
 */
function createChainableLogger(): ChainableLogger {
  // Base logging function
  const logger = (...args: any[]) => console.log(...args)

  // Add chalk styles as methods
  const styledLogger = Object.assign(logger, {
    step: (...args: any[]) => console.log(chalk.bold.underline(...args)),
    dim: (...args: any[]) => console.log(chalk.dim(...args)),
    success: (...args: any[]) => console.log(chalk.bold.blue(...args)),
    opts: (...args: any[]) => console.log(chalk.magentaBright.bold(...args)),
    wait: (...args: any[]) => console.log(chalk.bold.cyan(...args)),
    final: (...args: any[]) => console.log(chalk.bold.italic(...args)),
  })

  return styledLogger
}

/**
 * Creates a chainable error logger function.
 *
 * @returns A chainable logger that writes to stderr with styled methods.
 */
function createChainableErrorLogger(): ChainableLogger {
  // Base error logging function
  const errorLogger = (...args: any[]) => console.error(...args)

  // Add chalk styles as methods
  const styledErrorLogger = Object.assign(errorLogger, {
    step: (...args: any[]) => console.error(chalk.bold.underline(...args)),
    dim: (...args: any[]) => console.error(chalk.dim(...args)),
    success: (...args: any[]) => console.error(chalk.bold.blue(...args)),
    opts: (...args: any[]) => console.error(chalk.magentaBright.bold(...args)),
    wait: (...args: any[]) => console.error(chalk.bold.cyan(...args)),
    final: (...args: any[]) => console.error(chalk.bold.italic(...args)),
  })

  return styledErrorLogger
}

// Create and export the chainable loggers
export const l = createChainableLogger()
export const err = createChainableErrorLogger()

/**
 * Logs the current RSS processing action based on provided options.
 * 
 * @param options - Configuration options determining what to process.
 */
export function logRSSProcessingAction(options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    l.wait('\nProcessing specific items:')
    options.item.forEach((url) => l.wait(`  - ${url}`))
  } else if (options.last) {
    l.wait(`\nProcessing the last ${options.last} items`)
  } else if (options.skip) {
    l.wait(`  - Skipping first ${options.skip || 0} items`)
  }
}

/**
 * Logs the processing status and item counts for RSS feeds.
 * 
 * @param total - Total number of RSS items found.
 * @param processing - Number of RSS items to process.
 * @param options - Configuration options.
 */
export function logRSSProcessingStatus(
  total: number,
  processing: number,
  options: ProcessingOptions
): void {
  if (options.item && options.item.length > 0) {
    l.wait(`\n  - Found ${total} items in the RSS feed.`)
    l.wait(`  - Processing ${processing} specified items.`)
  } else if (options.last) {
    l.wait(`\n  - Found ${total} items in the RSS feed.`)
    l.wait(`  - Processing the last ${options.last} items.`)
  } else {
    l.wait(`\n  - Found ${total} item(s) in the RSS feed.`)
    l.wait(`  - Processing ${processing} item(s) after skipping ${options.skip || 0}.\n`)
  }
}

/**
 * Logs the current channel processing action based on provided options.
 * 
 * @param options - Configuration options determining what to process.
 */
export function logChannelProcessingAction(options: ProcessingOptions): void {
  if (options.last) {
    l.wait(`\nProcessing the last ${options.last} videos`)
  } else if (options.skip) {
    l.wait(`\nSkipping first ${options.skip || 0} videos`)
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
    l.wait(`\n  - Found ${total} videos in the channel.`)
    l.wait(`  - Processing the last ${processing} videos.`)
  } else if (options.skip) {
    l.wait(`\n  - Found ${total} videos in the channel.`)
    l.wait(`  - Processing ${processing} videos after skipping ${options.skip || 0}.\n`)
  } else {
    l.wait(`\n  - Found ${total} videos in the channel.`)
    l.wait(`  - Processing all ${processing} videos.\n`)
  }
}

/**
 * Logs a visual separator for Channel processing.
 *
 * @param index - The zero-based index of the current video being processed.
 * @param total - Total number of videos in the channel.
 * @param url - The URL of the video being processed.
 */
export function logChannelSeparator(index: number, total: number, url: string): void {
  l.opts(`\n================================================================================================`)
  l.opts(`  Processing video ${index + 1}/${total}: ${url}`)
  l.opts(`================================================================================================\n`)
}

/**
 * Logs a visual separator for Playlist processing.
 *
 * @param index - The zero-based index of the current video being processed.
 * @param total - Total number of videos in the playlist.
 * @param url - The URL of the video being processed.
 */
export function logPlaylistSeparator(index: number, total: number, url: string): void {
  l.opts(`\n================================================================================================`)
  l.opts(`  Processing video ${index + 1}/${total}: ${url}`)
  l.opts(`================================================================================================\n`)
}

/**
 * Logs a visual separator for an arbitrary list of URLs.
 *
 * @param index - The zero-based index of the current URL being processed.
 * @param total - Total number of URLs in the list.
 * @param url - The URL being processed.
 */
export function logURLsSeparator(index: number, total: number, url: string): void {
  l.opts(`\n================================================================================================`)
  l.opts(`  Processing URL ${index + 1}/${total}: ${url}`)
  l.opts(`================================================================================================\n`)
}

/**
 * Logs a visual separator for RSS items.
 *
 * @param index - The zero-based index of the current RSS item being processed.
 * @param total - Total number of RSS items in the feed.
 * @param title - The title of the RSS item being processed.
 */
export function logRSSSeparator(index: number, total: number, title: string): void {
  l.opts(`\n========================================================================================`)
  l.opts(`  Item ${index + 1}/${total} processing: ${title}`)
  l.opts(`========================================================================================\n`)
}

/**
 * Logs a visual separator indicating the completion of a given action.
 *
 * @param action - The action that was completed successfully.
 */
export function logCompletionSeparator(action: string): void {
  l.final(`\n================================================================================================`)
  l.final(`  ${action} Processing Completed Successfully.`)
  l.final(`================================================================================================\n`)
}