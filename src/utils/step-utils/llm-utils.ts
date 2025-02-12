// src/utils/llm-utils.ts

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { callOllama } from '../../llms/ollama'
import { callChatGPT } from '../../llms/chatgpt'
import { callClaude } from '../../llms/claude'
import { callGemini } from '../../llms/gemini'
import { callDeepSeek } from '../../llms/deepseek'
import { callFireworks } from '../../llms/fireworks'
import { callTogether } from '../../llms/together'

import chalk from 'chalk'
import { l, err } from '../logging'
import { ALL_MODELS } from '../../../shared/constants'

import type { LLMServices, OllamaTagsResponse } from '../types/llms'
import type { LogLLMCost } from '../types/logging'
import type { ProcessingOptions } from '../types/step-types'

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
 * @param {LLMServices} llmService - The selected LLM service (e.g., 'chatgpt', 'ollama', 'claude', etc.)
 * @returns {Promise<void>} A promise that resolves when cost estimation is complete
 */
export async function estimateLLMCost(
  options: ProcessingOptions,
  llmService: LLMServices
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

// Map of available LLM service handlers
export const LLM_FUNCTIONS = {
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  deepseek: callDeepSeek,
  fireworks: callFireworks,
  together: callTogether,
}

/**
 * checkOllamaServerAndModel()
 * ---------------------
 * Checks if the Ollama server is running, attempts to start it if not,
 * and ensures the specified model is available (pulling if needed).
 *
 * @param {string} ollamaHost - The Ollama host
 * @param {string} ollamaPort - The Ollama port
 * @param {string} ollamaModelName - The Ollama model name (e.g. 'qwen2.5:0.5b')
 * @returns {Promise<void>}
 */
export async function checkOllamaServerAndModel(
  ollamaHost: string,
  ollamaPort: string,
  ollamaModelName: string
) {
  // Helper to check if the Ollama server responds
  async function checkServer(): Promise<boolean> {
    try {
      const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
      return serverResponse.ok
    } catch (error) {
      return false
    }
  }

  l.dim(`[checkOllamaServerAndModel] Checking server: http://${ollamaHost}:${ollamaPort}`)

  // 1) Confirm the server is running
  if (await checkServer()) {
    l.dim('\n  Ollama server is already running...')
  } else {
    // If the Docker-based environment uses 'ollama' as hostname but it's not up, that's likely an error
    if (ollamaHost === 'ollama') {
      throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
    } else {
      // Attempt to spawn an Ollama server locally
      l.dim('\n  Ollama server is not running. Attempting to start it locally...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      ollamaProcess.unref()

      // Wait up to ~30 seconds for the server to respond
      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.dim('    - Ollama server is now ready.\n')
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
      if (attempts === 30) {
        throw new Error('Ollama server failed to become ready in time.')
      }
    }
  }

  // 2) Confirm the model is available; if not, pull it
  l.dim(`  Checking if model is available: ${ollamaModelName}`)
  try {
    const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
    if (!tagsResponse.ok) {
      throw new Error(`HTTP error! status: ${tagsResponse.status}`)
    }

    const tagsData = (await tagsResponse.json()) as OllamaTagsResponse
    const isModelAvailable = tagsData.models.some((m) => m.name === ollamaModelName)
    l.dim(`[checkOllamaServerAndModel] isModelAvailable=${isModelAvailable}`)

    if (!isModelAvailable) {
      l.dim(`\n  Model ${ollamaModelName} is NOT available; pulling now...`)
      const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaModelName }),
      })
      if (!pullResponse.ok) {
        throw new Error(`Failed to initiate pull for model ${ollamaModelName}`)
      }
      if (!pullResponse.body) {
        throw new Error('Response body is null while pulling model.')
      }

      const reader = pullResponse.body.getReader()
      const decoder = new TextDecoder()

      // Stream the JSON lines from the server
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.trim() === '') continue

          // Each line should be a JSON object from the Ollama server
          try {
            const parsedLine = JSON.parse(line)
            if (parsedLine.status === 'success') {
              l.dim(`    - Model ${ollamaModelName} pulled successfully.\n`)
              break
            }
          } catch (parseError) {
            err(`Error parsing JSON while pulling model: ${parseError}`)
          }
        }
      }
    } else {
      l.dim(`\n  Model ${ollamaModelName} is already available.\n`)
    }
  } catch (error) {
    err(`Error checking/pulling model: ${(error as Error).message}`)
    throw error
  }
}