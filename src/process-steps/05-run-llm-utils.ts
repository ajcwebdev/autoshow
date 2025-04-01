// src/process-steps/05-run-llm-utils.ts

import chalk from 'chalk'
import { l, err } from '../utils/logging.ts'
import { readFile } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import type { ProcessingOptions } from '../../shared/types.ts'
import { computeLLMCost } from '../utils/cost-calculator.ts'

export function formatCost(cost: number | undefined): string {
  if (cost === undefined) return 'N/A'
  if (cost === 0) return '0¢'
  const costInCents = cost * 100
  if (costInCents < 1) {
    return `¢${costInCents.toFixed(4)}`
  }
  if (cost < 1) {
    return `¢${costInCents.toFixed(2)}`
  }
  return `$${cost.toFixed(2)}`
}

/** 
 * Provide a simple “retryLLMCall” function, referenced by runLLM
 */
export async function retryLLMCall<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = 3
  let attempt = 0
  while (attempt < maxRetries) {
    attempt++
    try {
      return await fn()
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error))
      err(`LLM call attempt ${attempt}/${maxRetries} failed: ${e.message}`)
      if (attempt >= maxRetries) {
        throw e
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt))
    }
  }
  throw new Error('retryLLMCall: exhausted retries')
}

/**
 * Logs cost breakdown for an LLM call.
 */
export function logLLMCost(info: {
  name: string
  stopReason: string
  tokenUsage: {
    input: number | undefined
    output: number | undefined
    total: number | undefined
  }
}): {
  totalCost?: number
} {
  const { name, stopReason, tokenUsage } = info
  const { input, output, total } = tokenUsage

  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${name}`)

  const tokenLines: string[] = []
  if (input) tokenLines.push(`${input} input tokens`)
  if (output) tokenLines.push(`${output} output tokens`)
  if (total) tokenLines.push(`${total} total tokens`)

  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }

  let totalCost: number | undefined

  let foundServiceKey: string | undefined
  for (const [serviceKey, serviceCfg] of Object.entries(LLM_SERVICES_CONFIG)) {
    if (serviceCfg.models.some(m => m.modelId.toLowerCase() === name.toLowerCase())) {
      foundServiceKey = serviceKey
      break
    }
  }

  if (!foundServiceKey) {
    l.dim(`  * Could not find matching service config for model: ${name} -> cost=0`)
    totalCost = 0
  } else {
    totalCost = computeLLMCost(foundServiceKey as keyof typeof LLM_SERVICES_CONFIG, name, {
      input,
      output
    })
  }

  if (totalCost !== undefined) {
    l.dim(`  - Cost Breakdown:\n    - Total cost: ${chalk.bold(formatCost(totalCost))}`)
  }

  return { totalCost }
}

/**
 * Simplified function for rough LLM cost estimation if user passes --llmCost
 */
export async function estimateLLMCost(
  options: ProcessingOptions,
  llmService: string
): Promise<number> {
  const filePath = options.llmCost
  if (!filePath) {
    throw new Error('No file path provided to estimate LLM cost.')
  }
  l.dim(`\nEstimating LLM cost for '${llmService}' with file: ${filePath}`)

  try {
    const content = await readFile(filePath, 'utf8')
    const tokenCount = approximateTokens(content)
    const guessedOutput = 4000

    const foundServiceCfg = LLM_SERVICES_CONFIG[llmService as keyof typeof LLM_SERVICES_CONFIG]
    if (!foundServiceCfg) {
      l.dim('[estimateLLMCost] No recognized service config, cost=0')
      return 0
    }

    let userModel = typeof options[llmService] === 'string'
      ? options[llmService] as string
      : undefined

    if (!userModel || userModel === 'true') {
      userModel = foundServiceCfg.models[0]?.modelId || ''
    }

    const cost = computeLLMCost(
      llmService as keyof typeof LLM_SERVICES_CONFIG,
      userModel,
      { input: tokenCount, output: guessedOutput }
    )

    l.dim(`[estimateLLMCost] approx token usage: ${tokenCount} + ${guessedOutput} = ${tokenCount + guessedOutput}`)
    l.dim(`[estimateLLMCost] cost: ${formatCost(cost)}`)
    return cost
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    err(`Error estimating LLM cost: ${e.message}`)
    throw e
  }
}

/**
 * If we want to run LLM from a prompt file for a separate scenario.
 */
export async function runLLMFromPromptFile(
  filePath: string,
  _options: ProcessingOptions,
  llmService: string
): Promise<void> {
  l.dim(`[runLLMFromPromptFile] Loading file: ${filePath} with service: ${llmService}`)
  try {
    const content = await readFile(filePath, 'utf8')
    l.dim(`[runLLMFromPromptFile] file content length: ${content.length}`)
    // parse front matter or do further calls if needed
  } catch (subErr) {
    const e = subErr instanceof Error ? subErr : new Error(String(subErr))
    err(`Error in runLLMFromPromptFile: ${e.message}`)
    throw e
  }
}

function approximateTokens(text: string) {
  const words = text.trim().split(/\s+/)
  return Math.max(1, words.length)
}
