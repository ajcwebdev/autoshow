// src/utils/llm-models.ts

import type {
  ModelConfig,
  ChatGPTModelType,
  ClaudeModelType,
  CohereModelType,
  GeminiModelType,
  MistralModelType,
  OllamaModelType,
  TogetherModelType,
  FireworksModelType,
  GroqModelType,
} from '../types/llms'

/**
 * Configuration for Ollama models, mapping model types to their display names and identifiers.
 * Each model has a human-readable name and a corresponding model identifier used for API calls.
 * @type {ModelConfig<OllamaModelType>}
 */
export const OLLAMA_MODELS: ModelConfig<OllamaModelType> = {
  LLAMA_3_2_1B: {
    name: 'LLAMA 3 2 1B',
    modelId: 'llama3.2:1b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
  LLAMA_3_2_3B: {
    name: 'LLAMA 3 2 3B',
    modelId: 'llama3.2:3b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
  GEMMA_2_2B: {
    name: 'GEMMA 2 2B',
    modelId: 'gemma2:2b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
  PHI_3_5: {
    name: 'PHI 3 5',
    modelId: 'phi3.5:3.8b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
  QWEN_2_5_1B: {
    name: 'QWEN 2 5 1B',
    modelId: 'qwen2.5:1.5b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
  QWEN_2_5_3B: {
    name: 'QWEN 2 5 3B',
    modelId: 'qwen2.5:3b',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00
  },
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