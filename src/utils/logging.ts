// src/utils/logging.ts

import type { ProcessingOptions } from '../types/main'
import { XMLParser } from 'fast-xml-parser'
import chalk from 'chalk'
import type { ChalkInstance } from 'chalk'

/**
 * Configure XML parser for RSS feed processing
 * Handles attributes without prefixes and allows boolean values
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/**
 * Chalk styling for step indicators in the CLI
 * @type {ChalkInstance}
 */
export const step: ChalkInstance = chalk.bold.underline

/**
 * Chalk styling for dimmed text
 * @type {ChalkInstance}
 */
export const dim: ChalkInstance = chalk.dim

/**
 * Chalk styling for success messages
 * @type {ChalkInstance}
 */
export const success: ChalkInstance = chalk.bold.blue

/**
 * Chalk styling for options display
 * @type {ChalkInstance}
 */
export const opts: ChalkInstance = chalk.magentaBright.bold

/**
 * Chalk styling for wait/processing messages
 * @type {ChalkInstance}
 */
export const wait: ChalkInstance = chalk.bold.cyan

/**
 * Chalk styling for final messages
 * @type {ChalkInstance}
 */
export const final: ChalkInstance = chalk.bold.italic

/**
 * Convenience export for console.log
 * @type {typeof console.log}
 */
export const l: typeof console.log = console.log

/**
 * Convenience export for console.error
 * @type {typeof console.log}
 */
export const err: typeof console.error = console.error

/**
 * Logs the current processing action based on provided options.
 * 
 * @param options - Configuration options determining what to process
 */
export function logProcessingAction(options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    l(wait('\nProcessing specific items:'))
    options.item.forEach((url) => l(wait(`  - ${url}`)))
  } else if (options.last) {
    l(wait(`\nProcessing the last ${options.last} items`))
  } else if (options.skip) {
    l(wait(`  - Skipping first ${options.skip || 0} items`))
  }
}
  
/**
 * Logs the processing status and item counts.
 */
export function logProcessingStatus(total: number, processing: number, options: ProcessingOptions): void {
  if (options.item && options.item.length > 0) {
    l(wait(`\n  - Found ${total} items in the RSS feed.`))
    l(wait(`  - Processing ${processing} specified items.`))
  } else if (options.last) {
    l(wait(`\n  - Found ${total} items in the RSS feed.`))
    l(wait(`  - Processing the last ${options.last} items.`))
  } else {
    l(wait(`\n  - Found ${total} item(s) in the RSS feed.`))
    l(wait(`  - Processing ${processing} item(s) after skipping ${options.skip || 0}.\n`))
  }
}