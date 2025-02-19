// src/utils/logging.ts

import chalk from 'chalk'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/** 
 * For whichever service the user chose, we want to pick the user-supplied model 
 * or default to the service’s first model. Then pass that to the LLM function.
 */
export function getModelIdOrDefault(serviceKey: string, userValue: unknown): string {
  const serviceConfig = LLM_SERVICES_CONFIG[serviceKey as keyof typeof LLM_SERVICES_CONFIG]

  if (!serviceConfig) {
    // e.g. user typed --llmServices=foo but you have no 'foo' in LLM_SERVICES_CONFIG
    throw new Error(`Unsupported LLM service '${serviceKey}'`)
  }

  // If userValue is boolean true (meaning just --claude, with no model),
  // or an empty string, or undefined, pick the first model in that service.
  if (typeof userValue !== 'string' || userValue === 'true' || userValue.trim() === '') {
    const defaultModel = serviceConfig.models[0]
    if (!defaultModel) {
      // The service might have zero models (like 'skip'?). Fallback or return empty.
      throw new Error(`No models found for LLM service '${serviceKey}'`)
    }
    return defaultModel.value // e.g. 'gpt-4o-mini' or 'claude-3-sonnet-20240229'
  }

  // Otherwise userValue is a string with some model name.
  // You may want to check if it matches one of the known .value fields:
  const match = serviceConfig.models.find((m) => m.value === userValue)
  if (!match) {
    // If user typed a model that doesn't exist in your config, either throw or fallback:
    throw new Error(`Unknown model '${userValue}' for service '${serviceKey}'`)
  }

  return match.value
}

/**
 * Represents the configuration for a model, including cost details.
 */
export type ModelConfig = {
  value: string
  label: string
  inputCostPer1M: number
  outputCostPer1M: number
}

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
 * Logs API call results in a standardized format across different LLM providers.
 * Includes token usage and cost calculations.
 */
export function logLLMCost(info: LogLLMCost) {
  const { modelName, stopReason, tokenUsage } = info
  
  /**
   * Searches the consolidated LLM_SERVICES_CONFIG for a model config matching
   * the given model key.
   */
  function findModelConfig(modelKey: string): ModelConfig | undefined {
    for (const service of Object.values(LLM_SERVICES_CONFIG)) {
      for (const model of service.models) {
        if (
          model.value === modelKey ||
          model.value.toLowerCase() === modelKey.toLowerCase()
        ) {
          return model
        }
      }
    }
    return undefined
  }

  /**
   * Formats a cost value to a standardized string representation.
   */
  function formatCost(cost: number | undefined) {
    if (cost === undefined) return 'N/A'
    if (cost === 0) return '$0.0000'
    return `$${cost.toFixed(4)}`
  }

  // Get model display name if available, otherwise use the provided name
  const modelConfig = findModelConfig(modelName)
  const displayName = modelConfig?.label ?? modelName
  
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

  // If no config found, we can't compute cost reliably
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else if (
    modelConfig.inputCostPer1M !== undefined &&
    modelConfig.outputCostPer1M !== undefined &&
    modelConfig.inputCostPer1M < 0.0000001 &&
    modelConfig.outputCostPer1M < 0.0000001
  ) {
    // If both costs per million are effectively zero, return all zeros
    inputCost = 0
    outputCost = 0
    totalCost = 0
  } else if (
    modelConfig.inputCostPer1M !== undefined &&
    modelConfig.outputCostPer1M !== undefined
  ) {
    // Calculate costs if token usage is available
    if (tokenUsage.input) {
      const rawInputCost = (tokenUsage.input / 1_000_000) * modelConfig.inputCostPer1M
      inputCost = Math.abs(rawInputCost) < 0.00001 ? 0 : rawInputCost
    }
    if (tokenUsage.output) {
      outputCost = (tokenUsage.output / 1_000_000) * modelConfig.outputCostPer1M
    }
    // Calculate total cost if both input and output costs are available
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
export function logSeparator(params:
  | { type: 'channel' | 'playlist' | 'urls', index: number, total: number, descriptor: string  }
  | { type: 'rss', index: number, total: number, descriptor: string  }
  | { type: 'completion', descriptor: string  }
) {
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
 * Creates a chainable logger function that uses the provided base logging function
 * and attaches chalk-styled methods for consistent usage.
 *
 * @param baseLogger - The underlying logging function (e.g., `console.log` or `console.error`).
 * @returns A chainable logger instance with styled methods.
 */
function createChainableLogger(baseLogger: (...args: any[]) => void) {
  const logger = (...args: any[]) => baseLogger(...args)
  const styledLogger = Object.assign(logger, {
    step: (...args: any[]) => baseLogger(chalk.bold.underline(...args)),
    dim: (...args: any[]) => baseLogger(chalk.dim(...args)),
    success: (...args: any[]) => baseLogger(chalk.bold.blue(...args)),
    warn: (...args: any[]) => baseLogger(chalk.bold.yellow(...args)),
    opts: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    info: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    wait: (...args: any[]) => baseLogger(chalk.bold.cyan(...args)),
    final: (...args: any[]) => baseLogger(chalk.bold.italic(...args)),
  })
  return styledLogger
}

export const l = createChainableLogger(console.log)
export const err = createChainableLogger(console.error)