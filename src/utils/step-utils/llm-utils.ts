// src/utils/llm-utils.ts

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { callOllama } from '../../llms/ollama'
import { callChatGPT } from '../../llms/chatgpt'
import { callClaude } from '../../llms/claude'
import { callGemini } from '../../llms/gemini'
import { callCohere } from '../../llms/cohere'
import { callMistral } from '../../llms/mistral'
import { callDeepSeek } from '../../llms/deepseek'
import { callGrok } from '../../llms/grok'
import { callFireworks } from '../../llms/fireworks'
import { callTogether } from '../../llms/together'
import { callGroq } from '../../llms/groq'

import chalk from 'chalk'
import { l, err } from '../logging'

import type {
  ModelConfig,
  ChatGPTModelType,
  ClaudeModelType,
  CohereModelType,
  GeminiModelType,
  MistralModelType,
  DeepSeekModelType,
  GrokModelType,
  TogetherModelType,
  FireworksModelType,
  GroqModelType,
  LLMServiceConfig,
  LLMServices,
  ModelConfigValue,
  OllamaTagsResponse
} from '../types/llms'
import type { LogLLMCost } from '../types/logging'
import type { RequestBody, ProcessingOptions } from '../types/step-types'

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
function approximateTokens(text: string): number {
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
): Promise<void> {
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

/* ------------------------------------------------------------------
 * LLM Services & Model Configurations
 * ------------------------------------------------------------------ */

/**
 * Mapping of available LLM providers and their configuration.
 * A value of `null` indicates an option to skip LLM processing.
 * 
 */
export const LLM_SERVICES: Record<string, LLMServiceConfig> = {
  SKIP: { name: 'Skip LLM Processing', value: null },
  OLLAMA: { name: 'Ollama (local inference)', value: 'ollama' },
  CHATGPT: { name: 'OpenAI ChatGPT', value: 'chatgpt' },
  CLAUDE: { name: 'Anthropic Claude', value: 'claude' },
  GEMINI: { name: 'Google Gemini', value: 'gemini' },
  COHERE: { name: 'Cohere', value: 'cohere' },
  MISTRAL: { name: 'Mistral', value: 'mistral' },
  DEEPSEEK: { name: 'DeepSeek', value: 'deepseek' },
  GROK: { name: 'Grok', value: 'grok' },
  FIREWORKS: { name: 'Fireworks AI', value: 'fireworks' },
  TOGETHER: { name: 'Together AI', value: 'together' },
  GROQ: { name: 'Groq', value: 'groq' },
} as const

/**
 * Array of valid LLM service values (excluding the "SKIP" option).
 * 
 */
export const LLM_OPTIONS: LLMServices[] = Object.values(LLM_SERVICES)
  .map((service) => service.value)
  .filter((value): value is LLMServices => value !== null)

export const envVarsMap: Record<string, string> = {
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  cohereApiKey: 'COHERE_API_KEY',
  mistralApiKey: 'MISTRAL_API_KEY',
  grokApiKey: 'GROK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY',
  groqApiKey: 'GROQ_API_KEY',
}

/**
 * Maps server-side request body keys to corresponding environment variables.
 * 
 */
export const envVarsServerMap: Record<keyof RequestBody, string> = {
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  cohereApiKey: 'COHERE_API_KEY',
  mistralApiKey: 'MISTRAL_API_KEY',
  grokApiKey: 'GROK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY',
  groqApiKey: 'GROQ_API_KEY',
}

// Map of available LLM service handlers
export const LLM_FUNCTIONS = {
  ollama: callOllama,
  chatgpt: callChatGPT,
  claude: callClaude,
  gemini: callGemini,
  cohere: callCohere,
  mistral: callMistral,
  deepseek: callDeepSeek,
  grok: callGrok,
  fireworks: callFireworks,
  together: callTogether,
  groq: callGroq,
}

/**
 * Configuration for ChatGPT models, mapping model types to their display names and identifiers.
 * Includes various GPT-4 models with different capabilities and performance characteristics.
 * @type {ModelConfig<ChatGPTModelType>}
 */
export const GPT_MODELS: ModelConfig<ChatGPTModelType> = {
  GPT_4o_MINI: { 
    name: 'GPT 4 o MINI', 
    modelId: 'gpt-4o-mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
  GPT_4o: { 
    name: 'GPT 4 o', 
    modelId: 'gpt-4o',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00
  },
  GPT_o1_MINI: { 
    name: 'GPT o1 MINI', 
    modelId: 'o1-mini',
    inputCostPer1M: 3.00,
    outputCostPer1M: 12.00
  }
}

/**
 * Configuration for Claude models, mapping model types to their display names and identifiers.
 * Includes Anthropic's Claude 3 family of models with varying capabilities and performance profiles.
 * @type {ModelConfig<ClaudeModelType>}
 */
export const CLAUDE_MODELS: ModelConfig<ClaudeModelType> = {
  CLAUDE_3_5_SONNET: { 
    name: 'Claude 3.5 Sonnet', 
    modelId: 'claude-3-5-sonnet-latest',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00
  },
  CLAUDE_3_5_HAIKU: { 
    name: 'Claude 3.5 Haiku', 
    modelId: 'claude-3-5-haiku-latest',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00
  },
  CLAUDE_3_OPUS: { 
    name: 'Claude 3 Opus', 
    modelId: 'claude-3-opus-latest',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00
  },
  CLAUDE_3_SONNET: { 
    name: 'Claude 3 Sonnet', 
    modelId: 'claude-3-sonnet-20240229',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00
  },
  CLAUDE_3_HAIKU: { 
    name: 'Claude 3 Haiku', 
    modelId: 'claude-3-haiku-20240307',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25
  },
}

/**
 * Configuration for Google Gemini models, mapping model types to their display names and identifiers.
 * Includes Gemini 1.0 and 1.5 models optimized for different use cases.
 * @type {ModelConfig<GeminiModelType>}
 */
export const GEMINI_MODELS: ModelConfig<GeminiModelType> = {
  GEMINI_1_5_FLASH_8B: {
    name: 'Gemini 1.5 Flash-8B',
    modelId: 'gemini-1.5-flash-8b',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30
  },
  GEMINI_1_5_FLASH: {
    name: 'Gemini 1.5 Flash',
    modelId: 'gemini-1.5-flash',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
  GEMINI_1_5_PRO: {
    name: 'Gemini 1.5 Pro',
    modelId: 'gemini-1.5-pro',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00
  },
}

/**
 * Configuration for Cohere models, mapping model types to their display names and identifiers.
 * Features Command models specialized for different tasks and performance levels.
 * @type {ModelConfig<CohereModelType>}
 */
export const COHERE_MODELS: ModelConfig<CohereModelType> = {
  COMMAND_R: { 
    name: 'Command R', 
    modelId: 'command-r',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
  COMMAND_R_PLUS: { 
    name: 'Command R Plus', 
    modelId: 'command-r-plus',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00
  },
}

/**
 * Configuration for Mistral AI models, mapping model types to their display names and identifiers.
 * Includes Mixtral, Mistral, and Ministral models with various parameter sizes and capabilities.
 * @type {ModelConfig<MistralModelType>}
 */
export const MISTRAL_MODELS: ModelConfig<MistralModelType> = {
  MIXTRAL_8x7B: { 
    name: 'Mixtral 8x7B', 
    modelId: 'open-mixtral-8x7b',
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.70
  },
  MIXTRAL_8x22B: { 
    name: 'Mixtral 8x22B', 
    modelId: 'open-mixtral-8x22b',
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00
  },
  MISTRAL_LARGE: { 
    name: 'Mistral Large', 
    modelId: 'mistral-large-latest',
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00
  },
  MISTRAL_SMALL: { 
    name: 'Mistral Small', 
    modelId: 'mistral-small-latest',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60
  },
  MINISTRAL_8B: { 
    name: 'Ministral 8B', 
    modelId: 'ministral-8b-latest',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.10
  },
  MINISTRAL_3B: { 
    name: 'Ministral 3B', 
    modelId: 'ministral-3b-latest',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.04
  },
  MISTRAL_NEMO: { 
    name: 'Mistral NeMo', 
    modelId: 'open-mistral-nemo',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.15
  },
  MISTRAL_7B: { 
    name: 'Mistral 7B', 
    modelId: 'open-mistral-7b',
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.25
  },
}

/**
 * Configuration for Fireworks AI models, mapping model types to their display names and identifiers.
 * Features various LLaMA and Qwen models optimized for different use cases.
 * @type {ModelConfig<FireworksModelType>}
 */
export const FIREWORKS_MODELS: ModelConfig<FireworksModelType> = {
  LLAMA_3_1_405B: { 
    name: 'LLAMA 3 1 405B', 
    modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
    inputCostPer1M: 3.00,
    outputCostPer1M: 3.00
  },
  LLAMA_3_1_70B: { 
    name: 'LLAMA 3 1 70B', 
    modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    inputCostPer1M: 0.90,
    outputCostPer1M: 0.90
  },
  LLAMA_3_1_8B: { 
    name: 'LLAMA 3 1 8B', 
    modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.20
  },
  LLAMA_3_2_3B: { 
    name: 'LLAMA 3 2 3B', 
    modelId: 'accounts/fireworks/models/llama-v3p2-3b-instruct',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.10
  },
  QWEN_2_5_72B: { 
    name: 'QWEN 2 5 72B', 
    modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct',
    inputCostPer1M: 0.90,
    outputCostPer1M: 0.90
  },
}

/**
 * Configuration for Together AI models, mapping model types to their display names and identifiers.
 * Includes a diverse range of LLaMA, Gemma, and Qwen models with different parameter counts.
 * @type {ModelConfig<TogetherModelType>}
 */
export const TOGETHER_MODELS: ModelConfig<TogetherModelType> = {
  LLAMA_3_2_3B: { 
    name: 'LLAMA 3 2 3B', 
    modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    inputCostPer1M: 0.06,
    outputCostPer1M: 0.06
  },
  LLAMA_3_1_405B: { 
    name: 'LLAMA 3 1 405B', 
    modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    inputCostPer1M: 3.50,
    outputCostPer1M: 3.50
  },
  LLAMA_3_1_70B: { 
    name: 'LLAMA 3 1 70B', 
    modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    inputCostPer1M: 0.88,
    outputCostPer1M: 0.88
  },
  LLAMA_3_1_8B: { 
    name: 'LLAMA 3 1 8B', 
    modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    inputCostPer1M: 0.18,
    outputCostPer1M: 0.18
  },
  GEMMA_2_27B: { 
    name: 'Gemma 2 27B', 
    modelId: 'google/gemma-2-27b-it',
    inputCostPer1M: 0.80,
    outputCostPer1M: 0.80
  },
  GEMMA_2_9B: { 
    name: 'Gemma 2 9B', 
    modelId: 'google/gemma-2-9b-it',
    inputCostPer1M: 0.30,
    outputCostPer1M: 0.30
  },
  QWEN_2_5_72B: { 
    name: 'QWEN 2 5 72B', 
    modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    inputCostPer1M: 1.20,
    outputCostPer1M: 1.20
  },
  QWEN_2_5_7B: { 
    name: 'QWEN 2 5 7B', 
    modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
    inputCostPer1M: 0.30,
    outputCostPer1M: 0.30
  },
}

/**
 * Configuration for Groq models, mapping model types to their display names and identifiers.
 * Features optimized versions of LLaMA, Mixtral, and Gemma models for high-performance inference.
 * @type {ModelConfig<GroqModelType>}
 */
export const GROQ_MODELS: ModelConfig<GroqModelType> = {
  LLAMA_3_2_1B_PREVIEW: { 
    name: 'Llama 3.2 1B (Preview) 8k', 
    modelId: 'llama-3.2-1b-preview',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.04
  },
  LLAMA_3_2_3B_PREVIEW: { 
    name: 'Llama 3.2 3B (Preview) 8k', 
    modelId: 'llama-3.2-3b-preview',
    inputCostPer1M: 0.06,
    outputCostPer1M: 0.06
  },
  LLAMA_3_3_70B_VERSATILE: { 
    name: 'Llama 3.3 70B Versatile 128k', 
    modelId: 'llama-3.3-70b-versatile',
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79
  },
  LLAMA_3_1_8B_INSTANT: { 
    name: 'Llama 3.1 8B Instant 128k', 
    modelId: 'llama-3.1-8b-instant',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.08
  },
  MIXTRAL_8X7B_INSTRUCT: { 
    name: 'Mixtral 8x7B Instruct 32k', 
    modelId: 'mixtral-8x7b-32768',
    inputCostPer1M: 0.24,
    outputCostPer1M: 0.24
  },
}

/**
 * Configuration for Grok models, mapping model types to their display names and identifiers.
 * Pricing is hypothetical or as provided by xAI docs
 * @type {ModelConfig<GrokModelType>}
 */
export const GROK_MODELS: ModelConfig<GrokModelType> = {
  GROK_2_LATEST: {
    name: 'Grok 2 Latest',
    modelId: 'grok-2-latest',
    inputCostPer1M: 2.00,
    outputCostPer1M: 10.00
  },
}

/**
 * Configuration for DeepSeek models, mapping model types to their display names and identifiers.
 * Pricing is based on publicly listed rates for DeepSeek. 
 * @type {ModelConfig<DeepSeekModelType>}
 */
export const DEEPSEEK_MODELS: ModelConfig<DeepSeekModelType> = {
  DEEPSEEK_CHAT: {
    name: 'DeepSeek Chat',
    modelId: 'deepseek-chat',
    inputCostPer1M: 0.07,
    outputCostPer1M: 1.10
  },
  DEEPSEEK_REASONER: {
    name: 'DeepSeek Reasoner',
    modelId: 'deepseek-reasoner',
    inputCostPer1M: 0.14,
    outputCostPer1M: 2.19
  },
}

/**
 * All available model configurations combined
 */
export const ALL_MODELS: { [key: string]: ModelConfigValue } = {
  ...GPT_MODELS,
  ...CLAUDE_MODELS,
  ...GEMINI_MODELS,
  ...COHERE_MODELS,
  ...MISTRAL_MODELS,
  ...DEEPSEEK_MODELS,
  ...GROK_MODELS,
  ...FIREWORKS_MODELS,
  ...TOGETHER_MODELS,
  ...GROQ_MODELS,
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
): Promise<void> {
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