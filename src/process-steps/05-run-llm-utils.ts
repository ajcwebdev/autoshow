// src/process-steps/05-run-llm-utils.ts

/**
 * Utilities for LLM-related actions such as cost logging, file-based prompt loading,
 * and cost estimation.
 *
 * All references to `LLM_FUNCTIONS` and its type have been removed to reflect
 * direct usage of LLM calls in `05-run-llm.ts`.
 */

import chalk from 'chalk'
import { runLLM } from './05-run-llm.ts'
import { l, err } from '../utils/logging.ts'
import { readFile } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

/**
 * Returns a formatted cost string in cents or dollars based on magnitude.
 *
 * @param {number | undefined} cost - The cost in dollars
 * @returns {string} - Formatted string representing the cost
 */
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
 * Logs the LLM cost breakdown (input, output, total) by matching the model name
 * to entries in LLM_SERVICES_CONFIG.
 *
 * @param {object} info - The info containing the model name, stopReason, and token usage
 * @param {string} info.name - The model name/ID
 * @param {string} info.stopReason - The reason the LLM stopped generating
 * @param {object} info.tokenUsage - The token usage details
 * @param {number | undefined} info.tokenUsage.input - The input token count
 * @param {number | undefined} info.tokenUsage.output - The output token count
 * @param {number | undefined} info.tokenUsage.total - The total token count
 * @returns {{ inputCost?: number, outputCost?: number, totalCost?: number }}
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
  inputCost?: number
  outputCost?: number
  totalCost?: number
} {
  const { name, stopReason, tokenUsage } = info
  const { input, output, total } = tokenUsage

  let modelConfig: {
    modelId: string
    modelName: string
    inputCostPer1M?: number
    outputCostPer1M?: number
    inputCostPer1MCents?: number
    outputCostPer1MCents?: number
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

  const {
    modelName,
    inputCostPer1M,
    outputCostPer1M,
    inputCostPer1MCents,
    outputCostPer1MCents
  } = modelConfig ?? {}

  const displayName = modelName ?? name

  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)

  const tokenLines: string[] = []
  if (input) tokenLines.push(`${input} input tokens`)
  if (output) tokenLines.push(`${output} output tokens`)
  if (total) tokenLines.push(`${total} total tokens`)

  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }

  let inputCost: number | undefined
  let outputCost: number | undefined
  let totalCost: number | undefined

  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else {
    const inCost = (typeof inputCostPer1MCents === 'number')
      ? inputCostPer1MCents / 100
      : (inputCostPer1M || 0)

    const outCost = (typeof outputCostPer1MCents === 'number')
      ? outputCostPer1MCents / 100
      : (outputCostPer1M || 0)

    if (inCost < 0.0000001 && outCost < 0.0000001) {
      inputCost = 0
      outputCost = 0
      totalCost = 0
    } else {
      if (input) {
        const rawInputCost = (input / 1_000_000) * inCost
        inputCost = Math.abs(rawInputCost) < 0.00001 ? 0 : rawInputCost
      }
      if (output) {
        const rawOutputCost = (output / 1_000_000) * outCost
        outputCost = Math.abs(rawOutputCost) < 0.00001 ? 0 : rawOutputCost
      }
      if (inputCost !== undefined && outputCost !== undefined) {
        totalCost = inputCost + outputCost
      }
    }
  }

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

  if (costLines.length > 0) {
    l.dim(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }

  return { inputCost, outputCost, totalCost }
}

/**
 * A simple function to retry LLM calls with exponential backoff, up to 7 attempts.
 *
 * @param {() => Promise<T>} fn - The LLM call to be retried
 * @returns {Promise<T>} - The result of the LLM call if successful
 * @throws {Error} - If all attempts fail
 */
export async function retryLLMCall<T>(
  fn: () => Promise<T>
) {
  const maxRetries = 7
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      l.dim(`  Attempt ${attempt} - Processing LLM call...\n`)
      const result = await fn()
      l.dim(`\n  LLM call completed successfully on attempt ${attempt}.`)
      return result
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting LLM processing.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('LLM call failed after maximum retries.')
}

/**
 * Reads a prompt markdown file and calls runLLM with the parsed data.
 * This bypasses the earlier steps of front matter generation, audio download, and transcription.
 *
 * @param {string} filePath - Path to the markdown prompt file
 * @param {ProcessingOptions} options - Configuration options for LLM processing
 * @param {string} llmServices - The chosen LLM service
 */
export async function runLLMFromPromptFile(
  filePath: string,
  options: ProcessingOptions,
  llmServices: string,
) {
  try {
    const fileContent = await readFile(filePath, 'utf8')
    const { frontMatter, prompt, transcript, metadata } = parsePromptFile(fileContent)

    const finalPath = filePath.replace(/\.[^.]+$/, '')

    await runLLM(
      options,
      finalPath,
      frontMatter,
      prompt,
      transcript,
      metadata,
      llmServices,
      undefined,
      undefined,
      0
    )
  } catch (error) {
    err(`Error in runLLMFromPromptFile: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Parses a file containing front matter, prompt content, and transcript sections.
 *
 * @param {string} fileContent - The raw text content from the markdown file
 * @returns {{ frontMatter: string, prompt: string, transcript: string, metadata: ShowNoteMetadata }}
 */
function parsePromptFile(fileContent: string) {
  let frontMatter = ''
  let prompt = ''
  let transcript = ''
  let metadata: ShowNoteMetadata = {
    title: '',
    publishDate: ''
  }

  const lines = fileContent.split('\n')
  let readingFrontMatter = false
  let frontMatterDone = false
  let readingTranscript = false

  for (const line of lines) {
    if (!frontMatterDone && line.trim() === '---') {
      readingFrontMatter = !readingFrontMatter
      frontMatter += `${line}\n`
      if (!readingFrontMatter) {
        frontMatterDone = true
      }
      continue
    }

    if (!frontMatterDone && readingFrontMatter) {
      frontMatter += `${line}\n`
      const match = line.match(/^(\w+):\s*"?([^"]+)"?/)
      if (match) {
        const key = match[1]
        const value = match[2]
        if (key === 'showLink') metadata.showLink = value || ''
        if (key === 'channel') metadata.channel = value || ''
        if (key === 'channelURL') metadata.channelURL = value || ''
        if (key === 'title') metadata.title = value || ''
        if (key === 'description') metadata.description = value || ''
        if (key === 'publishDate') metadata.publishDate = value || ''
        if (key === 'coverImage') metadata.coverImage = value || ''
      }
      continue
    }

    if (line.trim().toLowerCase().startsWith('## transcript')) {
      readingTranscript = true
      transcript += `${line}\n`
      continue
    }

    if (readingTranscript) {
      transcript += `${line}\n`
    } else {
      prompt += `${line}\n`
    }
  }

  return { frontMatter, prompt, transcript, metadata }
}

/**
 * Estimates the cost for a given LLM by approximating token usage from a text file
 * and matching it to LLM_SERVICES_CONFIG cost data.
 *
 * @param {ProcessingOptions} options - The command-line options (should include llmCost path)
 * @param {string} llmService - The chosen LLM service
 * @returns {Promise<number>} - The estimated cost in dollars
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
    l.dim('[estimateLLMCost] reading file for cost estimate...')
    const content = await readFile(filePath, 'utf8')
    l.dim('[estimateLLMCost] file content length:', content.length)

    const tokenCount = approximateTokens(content)
    l.dim('[estimateLLMCost] approximate token count:', tokenCount)

    let userModel = typeof options[llmService] === 'string'
      ? options[llmService] as string
      : undefined

    if (llmService === 'chatgpt' && (userModel === undefined || userModel === 'true')) {
      userModel = 'gpt-4o-mini'
    }
    if (llmService === 'claude' && (userModel === undefined || userModel === 'true')) {
      userModel = 'claude-3-5-haiku-latest'
    }
    if (llmService === 'gemini' && (userModel === undefined || userModel === 'true')) {
      userModel = 'gemini-1.5-flash'
    }
    if (llmService === 'deepseek' && (userModel === undefined || userModel === 'true')) {
      userModel = 'deepseek-chat'
    }
    if (llmService === 'fireworks' && (userModel === undefined || userModel === 'true')) {
      userModel = 'accounts/fireworks/models/llama-v3p2-3b-instruct'
    }
    if (llmService === 'together' && (userModel === undefined || userModel === 'true')) {
      userModel = 'meta-llama/Llama-3.2-3B-Instruct-Turbo'
    }

    l.dim('[estimateLLMCost] determined userModel:', userModel)

    const name = userModel || llmService

    const costInfo = logLLMCost({
      name,
      stopReason: 'n/a',
      tokenUsage: {
        input: tokenCount,
        output: 4000,
        total: tokenCount
      }
    })

    l.dim('[estimateLLMCost] final cost estimate (totalCost):', costInfo.totalCost)
    return costInfo.totalCost ?? 0
  } catch (error) {
    err(`Error estimating LLM cost: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Approximates the token count by splitting the text content on whitespace.
 *
 * @param {string} text - The text to approximate tokens for
 * @returns {number} - The approximate token count
 */
function approximateTokens(text: string) {
  const words = text.trim().split(/\s+/)
  return Math.max(1, words.length)
}