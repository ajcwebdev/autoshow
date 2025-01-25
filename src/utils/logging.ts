// src/utils/logging.ts

import { execPromise } from './globals/process'
import { ALL_MODELS } from './globals/llms'
import chalk from 'chalk'

import type { ProcessingOptions, SeparatorParams } from './types/process'
import type { TranscriptionCostInfo } from './types/transcription'
import type { LogLLMCost, ChainableLogger } from './types/logging'

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

/**
 * Logs a visual separator for different processing contexts, including channels, playlists, RSS feeds, URLs, 
 * and a final completion message. 
 *
 * - For `channel`, `playlist`, or `urls`, provide `index`, `total`, and `descriptor` representing the URL.
 * - For `rss`, provide `index`, `total`, and `descriptor` representing the RSS item title.
 * - For `completion`, provide only the `descriptor` representing the completed action.
 *
 * @param params - An object describing the context and values needed to log the separator.
 */
export function logSeparator(params: SeparatorParams): void {
  switch (params.type) {
    case 'channel':
    case 'playlist':
    case 'urls':
      l.opts(`\n================================================================================================`)
      if (params.type === 'urls') {
        l.opts(`  Processing URL ${params.index + 1}/${params.total}: ${params.descriptor}`)
      } else {
        l.opts(`  Processing video ${params.index + 1}/${params.total}: ${params.descriptor}`)
      }
      l.opts(`================================================================================================\n`)
      break

    case 'rss':
      l.opts(`\n========================================================================================`)
      l.opts(`  Item ${params.index + 1}/${params.total} processing: ${params.descriptor}`)
      l.opts(`========================================================================================\n`)
      break

    case 'completion':
      l.final(`\n================================================================================================`)
      l.final(`  ${params.descriptor} Processing Completed Successfully.`)
      l.final(`================================================================================================\n`)
      break
  }
}

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
export function logLLMCost(info: LogLLMCost): void {
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
  let inputCost: number | undefined
  let outputCost: number | undefined
  let totalCost: number | undefined

  // Check if model config is found
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else if (modelConfig.inputCostPer1M === 0 && modelConfig.outputCostPer1M === 0) {
    // If both costs per million are zero, return all zeros
    inputCost = 0
    outputCost = 0
    totalCost = 0
  } else {
    // Calculate costs if token usage is available
    if (tokenUsage.input) {
      const rawInputCost = (tokenUsage.input / 1_000_000) * modelConfig.inputCostPer1M
      inputCost = Math.abs(rawInputCost) < 0.00001 ? 0 : rawInputCost
    }

    if (tokenUsage.output) {
      outputCost = (tokenUsage.output / 1_000_000) * modelConfig.outputCostPer1M
    }

    // Calculate total cost only if both input and output costs are available
    if (inputCost !== undefined && outputCost !== undefined) {
      totalCost = inputCost + outputCost
    }
  }

  const costLines = []
  
  if (inputCost !== undefined) {
    costLines.push(`Input cost: ${formatCost(inputCost)}`)
  }
  if (outputCost !== undefined) {
    costLines.push(`Output cost: ${formatCost(outputCost)}`)
  }
  if (totalCost !== undefined) {
    costLines.push(`Total cost: ${chalk.bold(formatCost(totalCost))}`)
  }

  // Log costs if any calculations were successful
  if (costLines.length > 0) {
    l.wait(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }
}

/**
 * Asynchronously logs the estimated transcription cost based on audio duration and per-minute cost.
 * Internally calculates the audio file duration using ffprobe.
 * @param info - Object containing the model name, cost per minute, and path to the audio file.
 * @throws {Error} If ffprobe fails or returns invalid data.
 */
export async function logTranscriptionCost(info: TranscriptionCostInfo): Promise<void> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const cost = info.costPerMinute * minutes

  l.wait(
    `  - Estimated Transcription Cost for ${info.modelName}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: $${cost.toFixed(4)}`
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