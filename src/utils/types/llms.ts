// src/types/llms.ts

/**
 * Options for Language Models (LLMs) that can be used in the application.
 */
export type LLMServices = 'chatgpt' | 'claude' | 'ollama' | 'gemini' | 'deepseek' | 'fireworks' | 'together'

/**
 * Available GPT models.
 */
export type ChatGPTModelType = 'GPT_4o_MINI' | 'GPT_4o' | 'GPT_o1_MINI'

/**
 * Available Claude models.
 */
export type ClaudeModelType = 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_5_HAIKU' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'

/**
 * Available Gemini models.
 */
export type GeminiModelType = 'GEMINI_1_5_FLASH' | 'GEMINI_1_5_FLASH_8B' | 'GEMINI_1_5_PRO'

/**
 * Available Fireworks models.
 */
export type FireworksModelType = 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'LLAMA_3_2_3B' | 'QWEN_2_5_72B'

/**
 * Available Together models.
 */
export type TogetherModelType = 'LLAMA_3_2_3B' | 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'GEMMA_2_27B' | 'GEMMA_2_9B' | 'QWEN_2_5_72B' | 'QWEN_2_5_7B'

/**
 * @typedef DeepSeekModelType
 * Represents the possible DeepSeek model IDs used within the application.
 */
export type DeepSeekModelType = 'DEEPSEEK_CHAT' | 'DEEPSEEK_REASONER'

/**
 * Response structure for Ollama model tags.
 */
export type OllamaTagsResponse = {
  /** Array of available models */
  models: Array<{
    /** Model name */
    name: string

    /** Base model identifier */
    model: string

    /** Last modification timestamp */
    modified_at: string

    /** Model size in bytes */
    size: number

    /** Model digest */
    digest: string

    /** Model details */
    details: {
      /** Parent model identifier */
      parent_model: string

      /** Model format */
      format: string

      /** Model family */
      family: string

      /** Array of model families */
      families: string[]

      /** Model parameter size */
      parameter_size: string

      /** Quantization level */
      quantization_level: string
    }
  }>
}