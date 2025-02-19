// shared/constants.ts

/**
 * @remarks
 * The Whisper model definitions include a `bin` property for the backend to reference
 * the required `.bin` files, while the frontend can simply use the `value` and `label`
 * for display and selection purposes.
 *
 */

export const PROCESS_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'file', label: 'File' },
] as const

/**
 * All user-facing prompt choices, unified for both backend and frontend usage.
 */
export const PROMPT_CHOICES: Array<{ name: string; value: string }> = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
  { name: 'Chapter Titles', value: 'chapterTitles' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'FAQ', value: 'faq' },
  { name: 'Blog', value: 'blog' },
  { name: 'Rap Song', value: 'rapSong' },
  { name: 'Rock Song', value: 'rockSong' },
  { name: 'Country Song', value: 'countrySong' },
]

export type TranscriptionCostInfo = {
  // The name of the model being used
  modelName: string
  // The cost (in USD) per minute for the model
  costPerMinute: number
  // The file path to the audio file
  filePath: string
}

/**
 * All user-facing transcription services, unified for both backend and frontend usage.
 */
export const TRANSCRIPTION_SERVICES: Array<{ value: string; label: string }> = [
  { value: 'whisper', label: 'Whisper.cpp' },
  { value: 'deepgram', label: 'Deepgram' },
  { value: 'assembly', label: 'AssemblyAI' },
]

export type WhisperOutput = {
  systeminfo: string
  model: {
    type: string
    multilingual: boolean
    vocab: number
    audio: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    text: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    mels: number
    ftype: number
  }
  params: {
    model: string
    language: string
    translate: boolean
  }
  result: {
    language: string
  }
  transcription: Array<{
    timestamps: {
      from: string
      to: string
    }
    offsets: {
      from: number
      to: number
    }
    text: string
  }>
}

/**
 * All user-facing Whisper models, mapping `value` to a specific `bin` file for
 * whisper.cpp usage. The `label` is used on the frontend UI, while the `bin`
 * path is crucial on the backend.
 */
export const WHISPER_MODELS: Array<{ value: string; label: string; }> = [
  { value: 'ggml-tiny.bin', label: 'tiny' },
  { value: 'ggml-tiny.en.bin', label: 'tiny.en' },
  { value: 'ggml-base.bin', label: 'base' },
  { value: 'ggml-base.en.bin', label: 'base.en' },
  { value: 'ggml-small.bin', label: 'small' },
  { value: 'ggml-small.en.bin', label: 'small.en' },
  { value: 'ggml-medium.bin', label: 'medium' },
  { value: 'ggml-medium.en.bin', label: 'medium.en' },
  { value: 'ggml-large-v1.bin', label: 'large-v1' },
  { value: 'ggml-large-v2.bin', label: 'large-v2' },
  { value: 'ggml-large-v3-turbo.bin', label: 'large-v3-turbo' },
  { value: 'ggml-large-v3-turbo.bin', label: 'turbo' },
]

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS = {
  NOVA_2: {
    name: 'Nova-2',
    modelId: 'nova-2',
    costPerMinute: 0.0043,
  },
  BASE: {
    name: 'Base',
    modelId: 'base',
    costPerMinute: 0.0125,
  },
  ENHANCED: {
    name: 'Enhanced',
    modelId: 'enhanced',
    costPerMinute: 0.0145,
  },
} as const

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS = {
  BEST: {
    name: 'Best',
    modelId: 'best',
    costPerMinute: 0.0062,
  },
  NANO: {
    name: 'Nano',
    modelId: 'nano',
    costPerMinute: 0.002,
  },
} as const

/**
 * A single consolidated constant for all user-facing LLM services, including
 * relevant model lists, display labels, and optional cost data.
 */
export const LLM_SERVICES_CONFIG = {
  skip: {
    name: 'Skip LLM Processing',
    value: null,
    label: 'Skip LLM Processing',
    models: []
  },
  ollama: {
    name: 'Ollama (local inference)',
    value: 'ollama',
    label: 'Ollama',
    models: [
      { value: 'qwen2.5:0.5b', modelId: 'qwen2.5:0.5b', label: 'QWEN 2 5 0B', name: 'QWEN 2 5 0B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'qwen2.5:1.5b', modelId: 'qwen2.5:1.5b', label: 'QWEN 2.5 1.5B', name: 'QWEN 2.5 1.5B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'qwen2.5:3b', modelId: 'qwen2.5:3b', label: 'QWEN 2.5 3B', name: 'QWEN 2.5 3B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'llama3.2:1b', modelId: 'llama3.2:1b', label: 'LLAMA 3.2 1B', name: 'LLAMA 3.2 1B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'llama3.2:3b', modelId: 'llama3.2:3b', label: 'LLAMA 3.2 3B', name: 'LLAMA 3.2 3B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'gemma2:2b', modelId: 'gemma2:2b', label: 'GEMMA 2 2B', name: 'GEMMA 2 2B', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'phi3.5:3.8b', modelId: 'phi3.5:3.8b', label: 'PHI 3.5', name: 'PHI 3.5', inputCostPer1M: 0, outputCostPer1M: 0 },
      { value: 'deepseek-r1:1.5b', modelId: 'deepseek-r1:1.5b', label: 'DEEPSEEK R1 1.5B', name: 'DEEPSEEK R1 1.5B', inputCostPer1M: 0, outputCostPer1M: 0 },
    ]
  },
  chatgpt: {
    name: 'OpenAI ChatGPT',
    value: 'chatgpt',
    label: 'ChatGPT',
    models: [
      {
        value: 'gpt-4o-mini',
        label: 'GPT 4o Mini',
        name: 'GPT 4 o MINI',
        modelId: 'gpt-4o-mini',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60
      },
      {
        value: 'gpt-4o',
        label: 'GPT 4o',
        name: 'GPT 4 o',
        modelId: 'gpt-4o',
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.00
      },
      {
        value: 'o1-mini',
        label: 'GPT o1 MINI',
        name: 'GPT o1 MINI',
        modelId: 'o1-mini',
        inputCostPer1M: 3.00,
        outputCostPer1M: 12.00
      }
    ]
  },
  claude: {
    name: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    models: [
      {
        value: 'claude-3-5-sonnet-20240620',
        label: 'Claude 3.5 Sonnet',
        name: 'Claude 3.5 Sonnet',
        modelId: 'claude-3-5-sonnet-latest',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00
      },
      {
        value: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus',
        name: 'Claude 3 Opus',
        modelId: 'claude-3-opus-latest',
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00
      },
      {
        value: 'claude-3-sonnet-20240229',
        label: 'Claude 3 Sonnet',
        name: 'Claude 3 Sonnet',
        modelId: 'claude-3-sonnet-20240229',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00
      },
      {
        value: 'claude-3-haiku-20240307',
        label: 'Claude 3 Haiku',
        name: 'Claude 3 Haiku',
        modelId: 'claude-3-haiku-20240307',
        inputCostPer1M: 0.25,
        outputCostPer1M: 1.25
      }
    ]
  },
  gemini: {
    name: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    models: [
      {
        value: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        name: 'Gemini 1.5 Flash',
        modelId: 'gemini-1.5-flash',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60
      },
      {
        value: 'gemini-1.5-pro-exp-0827',
        label: 'Gemini 1.5 Pro',
        name: 'Gemini 1.5 Pro (exp-0827)',
        modelId: 'gemini-1.5-pro',
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.00
      }
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    value: 'deepseek',
    label: 'Deepseek',
    models: [
      {
        value: 'deepseek-chat',
        label: 'DeepSeek Chat',
        name: 'DeepSeek Chat',
        modelId: 'deepseek-chat',
        inputCostPer1M: 0.07,
        outputCostPer1M: 1.10
      },
      {
        value: 'deepseek-reasoner',
        label: 'DeepSeek Reasoner',
        name: 'DeepSeek Reasoner',
        modelId: 'deepseek-reasoner',
        inputCostPer1M: 0.14,
        outputCostPer1M: 2.19
      }
    ]
  },
  fireworks: {
    name: 'Fireworks AI',
    value: 'fireworks',
    label: 'Fireworks',
    models: [
      {
        value: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
        label: 'LLAMA 3.1 405B',
        name: 'LLAMA 3 1 405B',
        modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
        inputCostPer1M: 3.00,
        outputCostPer1M: 3.00
      },
      {
        value: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        label: 'LLAMA 3.1 70B',
        name: 'LLAMA 3 1 70B',
        modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        inputCostPer1M: 0.90,
        outputCostPer1M: 0.90
      },
      {
        value: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        label: 'LLAMA 3.1 8B',
        name: 'LLAMA 3 1 8B',
        modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        inputCostPer1M: 0.20,
        outputCostPer1M: 0.20
      },
      {
        value: 'accounts/fireworks/models/llama-v3p2-3b-instruct',
        label: 'LLAMA 3.2 3B',
        name: 'LLAMA 3 2 3B',
        modelId: 'accounts/fireworks/models/llama-v3p2-3b-instruct',
        inputCostPer1M: 0.10,
        outputCostPer1M: 0.10
      },
      {
        value: 'accounts/fireworks/models/qwen2p5-72b-instruct',
        label: 'QWEN 2.5 72B',
        name: 'QWEN 2 5 72B',
        modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct',
        inputCostPer1M: 0.90,
        outputCostPer1M: 0.90
      }
    ]
  },
  together: {
    name: 'Together AI',
    value: 'together',
    label: 'Together AI',
    models: [
      {
        value: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        label: 'LLAMA 3.2 3B',
        name: 'LLAMA 3 2 3B',
        modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        inputCostPer1M: 0.06,
        outputCostPer1M: 0.06
      },
      {
        value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        label: 'LLAMA 3.1 405B',
        name: 'LLAMA 3 1 405B',
        modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        inputCostPer1M: 3.50,
        outputCostPer1M: 3.50
      },
      {
        value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        label: 'LLAMA 3.1 70B',
        name: 'LLAMA 3 1 70B',
        modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        inputCostPer1M: 0.88,
        outputCostPer1M: 0.88
      },
      {
        value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        label: 'LLAMA 3.1 8B',
        name: 'LLAMA 3 1 8B',
        modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        inputCostPer1M: 0.18,
        outputCostPer1M: 0.18
      },
      {
        value: 'google/gemma-2-27b-it',
        label: 'Gemma 2 27B',
        name: 'Gemma 2 27B',
        modelId: 'google/gemma-2-27b-it',
        inputCostPer1M: 0.80,
        outputCostPer1M: 0.80
      },
      {
        value: 'google/gemma-2-9b-it',
        label: 'Gemma 2 9B',
        name: 'Gemma 2 9B',
        modelId: 'google/gemma-2-9b-it',
        inputCostPer1M: 0.30,
        outputCostPer1M: 0.30
      },
      {
        value: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        label: 'QWEN 2.5 72B',
        name: 'QWEN 2 5 72B',
        modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        inputCostPer1M: 1.20,
        outputCostPer1M: 1.20
      },
      {
        value: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
        label: 'QWEN 2.5 7B',
        name: 'QWEN 2 5 7B',
        modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
        inputCostPer1M: 0.30,
        outputCostPer1M: 0.30
      }
    ]
  }
} as const