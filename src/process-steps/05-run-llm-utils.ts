// src/process-steps/05-run-llm-utils.ts

import chalk from 'chalk'
import { runLLM } from './05-run-llm'
import { callOllama } from '../llms/ollama'
import { callChatGPT } from '../llms/chatgpt'
import { callClaude } from '../llms/claude'
import { callGemini } from '../llms/gemini'
import { callDeepSeek } from '../llms/deepseek'
import { callFireworks } from '../llms/fireworks'
import { callTogether } from '../llms/together'
import { l, err } from '../utils/logging'
import { readFile } from '../utils/node-utils'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

import type { ProcessingOptions, ShowNoteMetadata } from '../utils/types'

/**
 * Formats a cost value to show cents as "¢1", fractions of a cent as "¢0.5", etc.
 *
 * @param cost - The cost value to format, in dollars
 * @returns A formatted string representation of the cost:
 *  - If cost is undefined => "N/A"
 *  - If cost is exactly 0 => "0¢"
 *  - If cost is less than one cent => e.g. "¢0.5000"
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
    // e.g. $0.005 => "¢0.5000"
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
 * Includes token usage and cost calculations, and returns the computed cost details.
 * 
 * @param info - The LLM cost and usage details
 * @param info.name - The name of the model used
 * @param info.stopReason - The reason why the model request stopped
 * @param info.tokenUsage - Contains token usage details
 * @param info.tokenUsage.input - Number of input tokens used
 * @param info.tokenUsage.output - Number of output tokens generated
 * @param info.tokenUsage.total - Total number of tokens involved in the request
 * @returns An object containing inputCost, outputCost, and totalCost (in dollars or zero if not found)
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
    throw new Error(`Unsupported LLM service '${serviceKey}'`)
  }

  if (typeof userValue !== 'string' || userValue === 'true' || userValue.trim() === '') {
    const defaultModel = serviceConfig.models[0]
    if (!defaultModel) {
      throw new Error(`No models found for LLM service '${serviceKey}'`)
    }
    return defaultModel.modelId
  }

  const match = serviceConfig.models.find((m) => m.modelId === userValue)
  if (!match) {
    throw new Error(`Unknown model '${userValue}' for service '${serviceKey}'`)
  }

  return match.modelId
}

/**
 * Retries a given LLM call with an exponential backoff of 7 attempts (1s initial delay).
 * 
 * @template T
 * @param {() => Promise<T>} fn - The function to execute for the LLM call
 * @returns {Promise<T>} Resolves when the function succeeds or rejects after 7 attempts
 * @throws {Error} If the function fails after all attempts
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

// Type for LLM function signatures
type LLMFunction = (prompt: string, transcript: string, options: any) => Promise<string>

// Map of available LLM service handlers
export const LLM_FUNCTIONS: Record<string, LLMFunction> = {
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  deepseek: callDeepSeek,
  fireworks: callFireworks,
  together: callTogether,
}

/**
 * Utility function to parse a markdown file that may contain front matter,
 * a prompt, and optionally a transcript section (marked by "## Transcript").
 * 
 * Front matter is assumed to be between the first pair of '---' lines at the top.
 * The content after front matter and before "## Transcript" is considered prompt,
 * and any content after "## Transcript" is considered transcript.
 *
 * Any recognized YAML keys in the front matter are mapped into the metadata object.
 * 
 * @param {string} fileContent - The content of the markdown file
 * @returns {ParsedPromptFile} An object containing frontMatter, prompt, transcript, and metadata
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
 * Reads a prompt markdown file and runs Step 5 (LLM processing) directly,
 * bypassing the earlier steps of front matter generation, audio download, and transcription.
 * 
 * The markdown file is expected to contain optional front matter delimited by '---' lines,
 * followed by prompt text, and optionally a "## Transcript" section.
 * 
 * This function extracts that content and calls {@link runLLM} with the user-specified LLM service.
 * 
 * @param {string} filePath - The path to the .md file containing front matter, prompt, and optional transcript
 * @param {ProcessingOptions} options - Configuration options (including any LLM model flags)
 * @param {string} llmServices - The chosen LLM service (e.g., 'chatgpt', 'claude', etc.)
 * @returns {Promise<void>} A promise that resolves when the LLM processing completes
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
      llmServices
    )
  } catch (error) {
    err(`Error in runLLMFromPromptFile: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Minimal token counting utility. Splits on whitespace to get an approximate token count.
 * For more accurate results with ChatGPT, a library like 'tiktoken' can be integrated.
 *
 * @param text - The text for which we need an approximate token count
 * @returns Approximate token count
 */
function approximateTokens(text: string) {
  const words = text.trim().split(/\s+/)
  return Math.max(1, words.length)
}

/**
 * estimateLLMCost()
 * -----------------
 * Estimates the cost for an LLM-based model by:
 * 1. Reading a combined prompt + transcript file
 * 2. Approximating the token usage
 * 3. Looking up cost info from the LLM model config
 * 4. Logging the estimated cost to the console
 *
 * @param {ProcessingOptions} options - The command-line options (must include `llmCost` file path)
 * @param {string} llmService - The selected LLM service (e.g., 'chatgpt', 'ollama', 'claude', etc.)
 * @returns {Promise<number>} The total cost (in dollars) or 0 if cost not found
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

    let userModel = typeof options[llmService] === 'string'
      ? options[llmService] as string
      : undefined

    if (llmService === 'chatgpt' && (userModel === undefined || userModel === 'true')) {
      userModel = 'gpt-4o-mini'
    }
    if (llmService === 'claude' && (userModel === undefined || userModel === 'true')) {
      userModel = 'claude-3-sonnet-20240229'
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

    return costInfo.totalCost ?? 0
  } catch (error) {
    err(`Error estimating LLM cost: ${(error as Error).message}`)
    throw error
  }
}