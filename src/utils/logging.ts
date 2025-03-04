// src/utils/logging.ts

import chalk from 'chalk'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Gets the model ID for the specified LLM service, using either the user-supplied value or the default.
 *
 * @param serviceKey - The key identifying the LLM service (e.g., 'chatgpt', 'claude')
 * @param userValue - The model value provided by the user, which could be a string, boolean, or undefined
 * @returns The resolved model ID string to use with the LLM service
 * @throws Error if the service is not supported or no models are found for the service
 * @throws Error if the user specified a model that doesn't exist for the given service
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
    return defaultModel.modelId // e.g. 'gpt-4o-mini' or 'claude-3-sonnet-20240229'
  }

  // Otherwise userValue is a string with some model name.
  // You may want to check if it matches one of the known .modelId fields:
  const match = serviceConfig.models.find((m) => m.modelId === userValue)
  if (!match) {
    // If user typed a model that doesn't exist in your config, either throw or fallback:
    throw new Error(`Unknown model '${userValue}' for service '${serviceKey}'`)
  }

  return match.modelId
}

/**
 * Formats a cost value to show cents as "¢1", fractions of a cent as "¢0.5", etc.
 *
 * @param cost - The cost value to format, in dollars
 * @returns A formatted string representation of the cost:
 *  - If cost is undefined => "N/A"
 *  - If cost is exactly 0 => "0¢"
 *  - If cost is less than one cent => e.g. "¢0.5" 
 *  - If cost is less than one dollar => e.g. "¢25.00"
 *  - Otherwise, format in dollars => e.g. "$1.99"
 * @example
 * formatCost(undefined) // returns "N/A"
 * formatCost(0) // returns "0¢"
 * formatCost(0.005) // returns "¢0.5000"
 * formatCost(0.25) // returns "¢25.00"
 * formatCost(1.99) // returns "$1.99"
 */
export function formatCost(cost: number | undefined): string {
  if (cost === undefined) return 'N/A'
  if (cost === 0) return '0¢'

  const costInCents = cost * 100

  // If total cost in cents is below 1, display fraction of a cent.
  if (costInCents < 1) {
    // e.g. $0.005 => "¢0.50"
    return `¢${costInCents.toFixed(4)}`
  }

  // If total cost is below $1, show in cents with two decimal places.
  if (cost < 1) {
    return `¢${costInCents.toFixed(2)}`
  }

  // Otherwise, display in dollars.
  return `$${cost.toFixed(2)}`
}

/**
 * Logs API call results in a standardized format across different LLM providers.
 * Includes token usage and cost calculations.
 * 
 * @param info - The LLM cost and usage details
 * @param info.name - The name of the model used
 * @param info.stopReason - The reason why the model request stopped
 * @param info.tokenUsage - Contains token usage details
 * @param info.tokenUsage.input - Number of input tokens used
 * @param info.tokenUsage.output - Number of output tokens generated
 * @param info.tokenUsage.total - Total number of tokens involved in the request
 */
export function logLLMCost(info: {
  name: string
  stopReason: string
  tokenUsage: {
    input: number | undefined
    output: number | undefined
    total: number | undefined
  }
}) {
  const { name, stopReason, tokenUsage } = info
  const { input, output, total } = tokenUsage

  let modelConfig: {
    modelId: string
    modelName: string
    inputCostPer1M: number
    outputCostPer1M: number
  } | undefined
  for (const service of Object.values(LLM_SERVICES_CONFIG)) {
    for (const model of service.models) {
      if (
        model.modelId === name ||
        model.modelId.toLowerCase() === name.toLowerCase()
      ) {
        modelConfig = model
        break
      }
    }
    if (modelConfig) break
  }

  // Destructure out of modelConfig if it was found
  const { modelName, inputCostPer1M, outputCostPer1M } = modelConfig ?? {}

  // Use model label if available, else fallback to the original name
  const displayName = modelName ?? name

  // Log stop/finish reason and model
  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)

  // Prepare token usage lines
  const tokenLines: string[] = []
  if (input) tokenLines.push(`${input} input tokens`)
  if (output) tokenLines.push(`${output} output tokens`)
  if (total) tokenLines.push(`${total} total tokens`)

  // Log token usage if there's any data
  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }

  // Calculate costs
  let inputCost: number | undefined
  let outputCost: number | undefined
  let totalCost: number | undefined

  if (!modelConfig) {
    // Warn if we have no cost information
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else if (
    inputCostPer1M !== undefined &&
    outputCostPer1M !== undefined &&
    inputCostPer1M < 0.0000001 &&
    outputCostPer1M < 0.0000001
  ) {
    // If both costs per million are effectively zero, treat them as zero
    inputCost = 0
    outputCost = 0
    totalCost = 0
  } else if (
    typeof inputCostPer1M === 'number' &&
    typeof outputCostPer1M === 'number'
  ) {
    if (input) {
      const rawInputCost = (input / 1_000_000) * inputCostPer1M
      inputCost = Math.abs(rawInputCost) < 0.00001 ? 0 : rawInputCost
    }
    if (output) {
      outputCost = (output / 1_000_000) * outputCostPer1M
    }
    if (inputCost !== undefined && outputCost !== undefined) {
      totalCost = inputCost + outputCost
    }
  }

  // Gather cost lines to log
  const costLines: string[] = []
  if (inputCost !== undefined) {
    costLines.push(`Input cost: ${formatCost(inputCost)}`)
  }
  if (outputCost !== undefined) {
    costLines.push(`Output cost: ${formatCost(outputCost)}`)
  }
  if (totalCost !== undefined) {
    costLines.push(`Total cost: ${chalk.bold(formatCost(totalCost))}`)
  }

  // Log cost breakdown
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