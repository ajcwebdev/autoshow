// src/utils/llm-utils.ts

import chalk from 'chalk'
import { readFile } from 'node:fs/promises'
import { l, err } from '../logging'
import { ALL_MODELS } from '../../../shared/constants'
import { runLLM } from '../../process-steps/05-run-llm'

import type { ProcessingOptions, EpisodeMetadata } from '../types'
import type { LogLLMCost } from '../../../shared/constants'

/**
 * @public
 * @typedef {Object} ParsedPromptFile
 * @property {string} frontMatter - The extracted front matter (including --- lines).
 * @property {string} prompt - The prompt text to be processed.
 * @property {string} transcript - The transcript text to be processed (if any).
 * @property {EpisodeMetadata} metadata - The metadata object parsed from front matter.
 */

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
  let metadata: EpisodeMetadata = {
    showLink: '',
    channel: '',
    channelURL: '',
    title: '',
    description: '',
    publishDate: '',
    coverImage: ''
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
        if (key === 'showLink') metadata.showLink = value
        if (key === 'channel') metadata.channel = value
        if (key === 'channelURL') metadata.channelURL = value
        if (key === 'title') metadata.title = value
        if (key === 'description') metadata.description = value
        if (key === 'publishDate') metadata.publishDate = value
        if (key === 'coverImage') metadata.coverImage = value
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

    // Derive a base "finalPath" from the file path, removing the .md extension if present
    const finalPath = filePath.replace(/\.[^.]+$/, '')

    // Execute Step 5
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
    l.dim(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
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
  // This is a naive approximation of tokens
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
 * @returns {Promise<void>} A promise that resolves when cost estimation is complete
 */
export async function estimateLLMCost(
  options: ProcessingOptions,
  llmService: string
) {
  const filePath = options.llmCost
  if (!filePath) {
    throw new Error('No file path provided to estimate LLM cost.')
  }

  l.dim(`\nEstimating LLM cost for '${llmService}' with file: ${filePath}`)

  try {
    // Read content from file
    const content = await readFile(filePath, 'utf8')
    const tokenCount = approximateTokens(content)

    /**
     * Determine if the user provided a specific model string (e.g. "--chatgpt GPT_4o"),
     * otherwise fallback to a default model if only "--chatgpt" was used.
     */
    let userModel = typeof options[llmService] === 'string'
      ? options[llmService] as string
      : undefined

    // Provide default fallback for ChatGPT if no string model was given
    if (llmService === 'chatgpt' && (userModel === undefined || userModel === 'true')) {
      userModel = 'GPT_4o_MINI'
    }

    // If still nothing is set, use the service name as a last resort
    const modelName = userModel || llmService

    // Log cost using the same function that logs LLM usage after real calls
    logLLMCost({
      modelName,
      stopReason: 'n/a',
      tokenUsage: {
        input: tokenCount,
        output: 4000,
        total: tokenCount
      }
    })

  } catch (error) {
    err(`Error estimating LLM cost: ${(error as Error).message}`)
    throw error
  }
}