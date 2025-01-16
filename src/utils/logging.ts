// src/utils/logging.ts

import { execPromise } from './globals/process'
import { ALL_MODELS } from './globals/llms'
import chalk from 'chalk'

import type { ProcessingOptions } from './types/process'
import type { TranscriptionCostInfo } from './types/transcription'
import type { TokenUsage, CostCalculation, APILogInfo, ChainableLogger } from './types/logging'

/**
 * Finds the model configuration based on the model key
 * @param modelKey - The key/name of the model (e.g., 'LLAMA_3_2_3B')
 * @returns The model configuration if found, undefined otherwise
 */
function findModelConfig(modelKey: string) {
  // First try to find the model directly in our combined models
  const model = ALL_MODELS[modelKey]
  if (model) return model

  // If not found by key, try matching by model ID as a fallback
  return Object.values(ALL_MODELS).find(model => 
    model.modelId.toLowerCase() === modelKey.toLowerCase()
  )
}

/**
 * Determines if a cost is effectively zero
 * @param cost - The cost to check
 * @returns true if the cost is zero or very close to zero
 */
function isEffectivelyZero(cost: number): boolean {
  return Math.abs(cost) < 0.00001
}

/**
 * Calculates the cost for token usage based on the model's pricing
 * @param modelKey - The key/name of the model
 * @param tokenUsage - Object containing token usage information
 * @returns Object containing calculated costs
 */
function calculateCosts(modelKey: string, tokenUsage: TokenUsage): CostCalculation {
  const modelConfig = findModelConfig(modelKey)
  
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelKey}`)
    return {
      inputCost: undefined,
      outputCost: undefined,
      totalCost: undefined
    }
  }

  // If both costs per million are zero, return all zeros
  if (modelConfig.inputCostPer1M === 0 && modelConfig.outputCostPer1M === 0) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0
    }
  }

  // Calculate costs if token usage is available
  const inputCost = tokenUsage.input 
    ? (tokenUsage.input / 1_000_000) * modelConfig.inputCostPer1M
    : undefined

  const outputCost = tokenUsage.output
    ? (tokenUsage.output / 1_000_000) * modelConfig.outputCostPer1M
    : undefined

  // Calculate total cost only if both input and output costs are available
  const totalCost = inputCost !== undefined && outputCost !== undefined
    ? inputCost + outputCost
    : undefined

  // Check if costs are effectively zero
  if (inputCost !== undefined && isEffectivelyZero(inputCost)) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0
    }
  }

  return {
    inputCost,
    outputCost,
    totalCost
  }
}

/**
 * Formats a cost value to a standardized string representation
 * @param cost - The cost value to format
 * @returns Formatted cost string
 */
function formatCost(cost: number | undefined): string {
  if (cost === undefined) return 'N/A'
  if (cost === 0) return '$0.0000'
  return `$${cost.toFixed(4)}`
}

/**
 * Logs API call results in a standardized format across different LLM providers.
 * Includes token usage and cost calculations.
 * @param info - Object containing model info, stop reason, and token usage
 */
export function logAPIResults(info: APILogInfo): void {
  const { modelName, stopReason, tokenUsage } = info
  
  // Get model display name if available, otherwise use the provided name
  const modelConfig = findModelConfig(modelName)
  const displayName = modelConfig?.name ?? modelName
  
  // Log stop/finish reason and model
  l.wait(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)
  
  // Format token usage string based on available data
  const tokenLines = []
  if (tokenUsage.input) tokenLines.push(`${tokenUsage.input} input tokens`)
  if (tokenUsage.output) tokenLines.push(`${tokenUsage.output} output tokens`)
  if (tokenUsage.total) tokenLines.push(`${tokenUsage.total} total tokens`)
  
  // Log token usage if any data is available
  if (tokenLines.length > 0) {
    l.wait(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }

  // Calculate and log costs
  const costs = calculateCosts(modelName, tokenUsage)
  const costLines = []
  
  if (costs.inputCost !== undefined) {
    costLines.push(`Input cost: ${formatCost(costs.inputCost)}`)
  }
  if (costs.outputCost !== undefined) {
    costLines.push(`Output cost: ${formatCost(costs.outputCost)}`)
  }
  if (costs.totalCost !== undefined) {
    costLines.push(`Total cost: ${chalk.bold(formatCost(costs.totalCost))}`)
  }

  // Log costs if any calculations were successful
  if (costLines.length > 0) {
    l.wait(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }
}

/**
 * Asynchronously retrieves the duration (in seconds) of an audio file using ffprobe.
 * @param filePath - The path to the audio file.
 * @returns {Promise<number>} - The duration of the audio in seconds.
 * @throws {Error} If ffprobe fails or returns invalid data.
 */
export async function getAudioDurationInSeconds(filePath: string): Promise<number> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  return seconds
}

/**
 * Logs the estimated transcription cost based on audio duration and per-minute cost.
 * @param info - Object containing the model name, total cost, and audio length in minutes.
 */
export function logTranscriptionCost(info: TranscriptionCostInfo): void {
  l.wait(
    `  - Estimated Transcription Cost for ${info.modelName}:\n` +
    `    - Audio Length: ${info.minutes.toFixed(2)} minutes\n` +
    `    - Cost: $${info.cost.toFixed(4)}`
  )
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
    warn: (...args: any[]) => console.log(chalk.bold.yellow(...args)),
    opts: (...args: any[]) => console.log(chalk.magentaBright.bold(...args)),
    info: (...args: any[]) => console.log(chalk.magentaBright.bold(...args)),
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
    warn: (...args: any[]) => console.error(chalk.bold.yellow(...args)),
    opts: (...args: any[]) => console.error(chalk.magentaBright.bold(...args)),
    info: (...args: any[]) => console.error(chalk.magentaBright.bold(...args)),
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

/**
 * Logs the first step of a top-level function call with its relevant options or parameters.
 *
 * @param functionName - The name of the top-level function being invoked.
 * @param details - An object containing relevant parameters to log
 */
export function logInitialFunctionCall(functionName: string, details: Record<string, unknown>): void {
  l.info(`${functionName} called with the following arguments:`)
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'object' && value !== null) {
      l.opts(`  - ${key}: ${JSON.stringify(value, null, 2)}`)
    } else {
      l.opts(`  - ${key}: ${value}`)
    }
  }
  l.opts('')
}