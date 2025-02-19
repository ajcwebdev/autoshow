// src/utils/logging.ts

import chalk from 'chalk'
import { ALL_MODELS } from '../../shared/constants'

/**
 * Represents the complete LLM cost and usage details for logging
 */
export type LogLLMCost = {
  // The name of the model used
  modelName: string
  // The reason why the model request stopped
  stopReason: string
  // Contains token usage details
  tokenUsage: {
    // Number of input tokens used
    input: number | undefined
    // Number of output tokens generated
    output: number | undefined
    // Total number of tokens involved in the request
    total: number | undefined
  }
}

/**
 * Finds the model configuration based on the model key
 * @param modelKey - The key/name of the model (e.g., 'LLAMA_3_2_3B')
 * @returns The model configuration if found, undefined otherwise
 */
function findModelConfig(modelKey: string) {
  // First try to find the model directly in our combined models
  const model = ALL_MODELS[modelKey as keyof typeof ALL_MODELS]
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
function formatCost(cost: number | undefined) {
  if (cost === undefined) return 'N/A'
  if (cost === 0) return '$0.0000'
  return `$${cost.toFixed(4)}`
}

/**
 * Logs API call results in a standardized format across different LLM providers.
 * Includes token usage and cost calculations.
 * @param info - Object containing model info, stop reason, and token usage
 */
export function logLLMCost(info: LogLLMCost) {
  const { modelName, stopReason, tokenUsage } = info
  
  // Get model display name if available, otherwise use the provided name
  const modelConfig = findModelConfig(modelName)
  const displayName = modelConfig?.name ?? modelName
  
  // Log stop/finish reason and model
  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)
  
  // Format token usage string based on available data
  const tokenLines = []
  if (tokenUsage.input) tokenLines.push(`${tokenUsage.input} input tokens`)
  if (tokenUsage.output) tokenLines.push(`${tokenUsage.output} output tokens`)
  if (tokenUsage.total) tokenLines.push(`${tokenUsage.total} total tokens`)
  
  // Log token usage if any data is available
  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }

  // Calculate and log costs
  let inputCost: number | undefined
  let outputCost: number | undefined
  let totalCost: number | undefined

  // Check if model config is found
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else if (modelConfig.inputCostPer1M < 0.0000001 && modelConfig.outputCostPer1M < 0.0000001) {
    // If both costs per million are effectively zero, return all zeros
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
    l.dim(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }
}

/**
 * A union type representing the various logging contexts for which a separator can be logged.
 */
export type SeparatorParams = {
  // The context type: channel, playlist, or urls
  type: 'channel' | 'playlist' | 'urls'
  // The zero-based index of the current item being processed
  index: number
  // The total number of items to be processed
  total: number
  // The URL string to be displayed
  descriptor: string
} | {
  // The context type: rss
  type: 'rss'
  // The zero-based index of the current item being processed
  index: number
  // The total number of items to be processed
  total: number
  // The title string to be displayed
  descriptor: string
} | {
  // The context type: completion
  type: 'completion'
  // The action string that was completed successfully
  descriptor: string
}

/**
 * Logs the first step of a top-level function call with its relevant options or parameters.
 *
 * @param functionName - The name of the top-level function being invoked.
 * @param details - An object containing relevant parameters to log
 */
export function logInitialFunctionCall(functionName: string, details: Record<string, unknown>): void {
  l.opts(`${functionName} called with the following arguments:\n`)
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'object' && value !== null) {
      l.opts(`${key}:\n`)
      l.opts(`${JSON.stringify(value, null, 2)}`)
    } else {
      l.opts(`${key}: ${value}`)
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
export function logSeparator(params: SeparatorParams) {
  switch (params.type) {
    case 'channel':
    case 'playlist':
    case 'urls':
      l.final(`\n================================================================================================`)
      if (params.type === 'urls') {
        l.final(`  Processing URL ${params.index + 1}/${params.total}: ${params.descriptor}`)
      } else {
        l.final(`  Processing video ${params.index + 1}/${params.total}: ${params.descriptor}`)
      }
      l.final(`================================================================================================\n`)
      break

    case 'rss':
      l.final(`\n========================================================================================`)
      l.final(`  Item ${params.index + 1}/${params.total} processing: ${params.descriptor}`)
      l.final(`========================================================================================\n`)
      break

    case 'completion':
      l.final(`\n================================================================================================`)
      l.final(`  ${params.descriptor} Processing Completed Successfully.`)
      l.final(`================================================================================================\n`)
      break
  }
}

/**
 * Interface for chainable logger with style methods.
 */
export interface ChainableLogger {
  (...args: any[]): void
  step: (...args: any[]) => void
  dim: (...args: any[]) => void
  success: (...args: any[]) => void
  warn: (...args: any[]) => void
  opts: (...args: any[]) => void
  info: (...args: any[]) => void
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