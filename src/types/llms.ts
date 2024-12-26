// src/types/llms.ts

/**
 * Options for Language Models (LLMs) that can be used in the application.
 */
export type LLMServices = 'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'ollama' | 'gemini' | 'fireworks' | 'together' | 'groq'

/**
 * Options for LLM processing.
 */
export type LLMOptions = {
  /** The sections to include in the prompt (e.g., ['titles', 'summary']). */
  promptSections?: string[]

  /** The specific LLM model to use. */
  model?: string

  /** The temperature parameter for text generation. */
  temperature?: number

  /** The maximum number of tokens to generate. */
  maxTokens?: number
}

/**
 * Function that calls an LLM for processing.
 * 
 * @param promptAndTranscript - The combined prompt and transcript
 * @param tempPath - The temporary file path
 * @param llmModel - The specific LLM model to use (optional)
 */
export type LLMFunction = (
  promptAndTranscript: string,
  tempPath: string,
  llmModel?: string
) => Promise<void>

/**
 * Mapping of LLM option keys to their corresponding functions.
 */
export type LLMFunctions = {
  [K in LLMServices]: LLMFunction
}

// LLM Model Types
/**
 * Available GPT models.
 */
export type ChatGPTModelType = 'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'

/**
 * Available Claude models.
 */
export type ClaudeModelType = 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'

/**
 * Available Cohere models.
 */
export type CohereModelType = 'COMMAND_R' | 'COMMAND_R_PLUS'

/**
 * Available Gemini models.
 */
export type GeminiModelType = 'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'

/**
 * Available Mistral AI models.
 */
export type MistralModelType = 'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'

/**
 * Available Fireworks models.
 */
export type FireworksModelType = 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'LLAMA_3_2_3B' | 'LLAMA_3_2_1B' | 'QWEN_2_5_72B'

/**
 * Available Together models.
 */
export type TogetherModelType = 'LLAMA_3_2_3B' | 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'GEMMA_2_27B' | 'GEMMA_2_9B' | 'QWEN_2_5_72B' | 'QWEN_2_5_7B'

/**
 * Available Groq models.
 */
export type GroqModelType = 'LLAMA_3_1_70B_VERSATILE' | 'LLAMA_3_1_8B_INSTANT' | 'LLAMA_3_2_1B_PREVIEW' | 'LLAMA_3_2_3B_PREVIEW' | 'MIXTRAL_8X7B_32768'

/**
 * Local model with Ollama.
 */
export type OllamaModelType = 'LLAMA_3_2_1B' | 'LLAMA_3_2_3B' | 'GEMMA_2_2B' | 'PHI_3_5' | 'QWEN_2_5_1B' | 'QWEN_2_5_3B'

// API Response Types
/**
 * Response structure from Fireworks AI API.
 */
export type FireworksResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** Input prompts */
  prompt: any[]

  /** Array of completion choices */
  choices: {
    /** Reason for completion finish */
    finish_reason: string

    /** Index of the choice */
    index: number

    /** Message content and metadata */
    message: {
      /** Role of the message author */
      role: string

      /** Generated content */
      content: string

      /** Tool calls made during generation */
      tool_calls: {
        /** Tool call identifier */
        id: string

        /** Type of tool call */
        type: string

        /** Function call details */
        function: {
          /** Name of the function called */
          name: string

          /** Arguments passed to the function */
          arguments: string
        }
      }[]
    }
  }[]
  /** Token usage statistics */
  usage: {
    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number
  }
}

/**
 * Response structure from Together AI API.
 */
export type TogetherResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** Input prompts */
  prompt: any[]

  /** Array of completion choices */
  choices: {
    /** Generated text */
    text: string

    /** Reason for completion finish */
    finish_reason: string

    /** Random seed used */
    seed: number

    /** Choice index */
    index: number

    /** Message content and metadata */
    message: {
      /** Role of the message author */
      role: string

      /** Generated content */
      content: string

      /** Tool calls made during generation */
      tool_calls: {
        /** Index of the tool call */
        index: number

        /** Tool call identifier */
        id: string

        /** Type of tool call */
        type: string

        /** Function call details */
        function: {
          /** Name of the function called */
          name: string

          /** Arguments passed to the function */
          arguments: string
        }
      }[]
    }
    /** Log probability information */
    logprobs: {
      /** Array of token IDs */
      token_ids: number[]

      /** Array of tokens */
      tokens: string[]

      /** Log probabilities for tokens */
      token_logprobs: number[]
    }
  }[]
  /** Token usage statistics */
  usage: {
    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number
  }
}

/**
 * Response structure from Groq Chat Completion API.
 */
export type GroqChatCompletionResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** System fingerprint */
  system_fingerprint: string | null

  /** Array of completion choices */
  choices: {
    /** Choice index */
    index: number

    /** Message content and metadata */
    message: {
      /** Role of the message author */
      role: 'assistant' | 'user' | 'system'

      /** Generated content */
      content: string
    }

    /** Reason for completion finish */
    finish_reason: string

    /** Optional log probability information */
    logprobs?: {
      /** Array of tokens */
      tokens: string[]

      /** Log probabilities for tokens */
      token_logprobs: number[]

      /** Top log probabilities */
      top_logprobs: Record<string, number>[]

      /** Text offsets for tokens */
      text_offset: number[]
    } | null
  }[]
  /** Optional usage statistics */
  usage?: {
    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number

    /** Optional timing for prompt processing */
    prompt_time?: number

    /** Optional timing for completion generation */
    completion_time?: number

    /** Optional total processing time */
    total_time?: number
  }
}

/**
 * Response structure from Ollama API.
 */
export type OllamaResponse = {
  /** Model used for generation */
  model: string

  /** Timestamp of creation */
  created_at: string

  /** Message content and metadata */
  message: {
    /** Role of the message author */
    role: string

    /** Generated content */
    content: string
  }
  /** Reason for completion */
  done_reason: string

  /** Whether generation is complete */
  done: boolean

  /** Total processing duration */
  total_duration: number

  /** Model loading duration */
  load_duration: number

  /** Number of prompt evaluations */
  prompt_eval_count: number

  /** Duration of prompt evaluation */
  prompt_eval_duration: number

  /** Number of evaluations */
  eval_count: number

  /** Duration of evaluation */
  eval_duration: number
}

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