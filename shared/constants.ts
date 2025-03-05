// shared/constants.ts

export const ENV_VARS_MAP = {
  openaiApiKey: 'OPENAI_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  deepgramApiKey: 'DEEPGRAM_API_KEY',
  assemblyApiKey: 'ASSEMBLY_API_KEY',
  geminiApiKey: 'GEMINI_API_KEY',
  deepseekApiKey: 'DEEPSEEK_API_KEY',
  togetherApiKey: 'TOGETHER_API_KEY',
  fireworksApiKey: 'FIREWORKS_API_KEY',
}

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
  { name: 'Quotes', value: 'quotes' },
  { name: 'Chapter Titles and Quotes', value: 'chapterTitlesAndQuotes' },
  { name: 'Social Post (X)', value: 'x' },
  { name: 'Social Post (Facebook)', value: 'facebook' },
  { name: 'Social Post (LinkedIn)', value: 'linkedin' },
]

/**
 * A single consolidated constant for all user-facing transcription services, including
 * relevant model lists, display labels, optional cost data, and whisper model `.bin` references.
 */
export const TRANSCRIPTION_SERVICES_CONFIG = {
  whisper: {
    serviceName: 'Whisper.cpp',
    value: 'whisper',
    label: 'Whisper.cpp',
    models: [
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
  },
  deepgram: {
    serviceName: 'Deepgram',
    value: 'deepgram',
    label: 'Deepgram',
    models: [
      { name: 'Nova-2', modelId: 'nova-2', costPerMinute: 0.0043 },
      { name: 'Base', modelId: 'base', costPerMinute: 0.0125 },
      { name: 'Enhanced', modelId: 'enhanced', costPerMinute: 0.0145 },
    ]
  },
  assembly: {
    serviceName: 'AssemblyAI',
    value: 'assembly',
    label: 'AssemblyAI',
    models: [
      { name: 'Best', modelId: 'best', costPerMinute: 0.0062 },
      { name: 'Nano', modelId: 'nano', costPerMinute: 0.002 },
    ]
  },
} as const

/**
 * A single consolidated constant for all user-facing LLM services, including
 * relevant model lists, display labels, and optional cost data.
 */
export const LLM_SERVICES_CONFIG = {
  skip: {
    serviceName: 'Skip LLM Processing',
    value: null,
    label: 'Skip LLM Processing',
    models: []
  },
  ollama: {
    serviceName: 'Ollama (local inference)',
    value: 'ollama',
    label: 'Ollama',
    models: [
      { modelName: 'QWEN 2 5 0B', modelId: 'qwen2.5:0.5b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'QWEN 2.5 1.5B', modelId: 'qwen2.5:1.5b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'QWEN 2.5 3B', modelId: 'qwen2.5:3b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'LLAMA 3.2 1B', modelId: 'llama3.2:1b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'LLAMA 3.2 3B', modelId: 'llama3.2:3b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'GEMMA 2 2B', modelId: 'gemma2:2b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'PHI 3.5', modelId: 'phi3.5:3.8b', inputCostPer1M: 0, outputCostPer1M: 0 },
      { modelName: 'DEEPSEEK R1 1.5B', modelId: 'deepseek-r1:1.5b', inputCostPer1M: 0, outputCostPer1M: 0 },
    ]
  },
  chatgpt: {
    serviceName: 'OpenAI ChatGPT',
    value: 'chatgpt',
    label: 'ChatGPT',
    models: [
      { modelName: 'GPT 4.5 PREVIEW', modelId: 'gpt-4.5-preview', inputCostPer1M: 75.00, outputCostPer1M: 150.00 },
      { modelName: 'GPT 4o', modelId: 'gpt-4o', inputCostPer1M: 2.50, outputCostPer1M: 10.00 },
      { modelName: 'GPT 4o MINI', modelId: 'gpt-4o-mini', inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
      // { modelName: 'GPT o1', modelId: 'o1', inputCostPer1M: 15.00, outputCostPer1M: 60.00 },
      // { modelName: 'GPT o3 MINI', modelId: 'o3-mini', inputCostPer1M: 1.10, outputCostPer1M: 4.40 },
      { modelName: 'GPT o1 MINI', modelId: 'o1-mini', inputCostPer1M: 1.10, outputCostPer1M: 4.40 }
    ]
  },
  claude: {
    serviceName: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    models: [
      { modelName: 'Claude 3.7 Sonnet', modelId: 'claude-3-7-sonnet-latest', inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
      { modelName: 'Claude 3.5 Haiku', modelId: 'claude-3-5-haiku-latest', inputCostPer1M: 0.80, outputCostPer1M: 4.00 },
      { modelName: 'Claude 3 Opus', modelId: 'claude-3-opus-latest', inputCostPer1M: 15.00, outputCostPer1M: 75.00 }
    ]
  },
  gemini: {
    serviceName: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    models: [
      { modelName: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro', inputCostPer1M: 2.50, outputCostPer1M: 10.00 },
      { modelName: 'Gemini 1.5 Flash-8B', modelId: 'gemini-1.5-flash-8b', inputCostPer1M: 0.075, outputCostPer1M: 0.30 },
      { modelName: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash', inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
      { modelName: 'Gemini 2.0 Flash-Lite', modelId: 'gemini-2.0-flash-lite', inputCostPer1M: 0.075, outputCostPer1M: 0.30 },
      { modelName: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', inputCostPer1M: 0.10, outputCostPer1M: 0.40 }
    ]
  },
  deepseek: {
    serviceName: 'DeepSeek',
    value: 'deepseek',
    label: 'Deepseek',
    models: [
      { modelName: 'DeepSeek Chat', modelId: 'deepseek-chat', inputCostPer1M: 0.07, outputCostPer1M: 1.10 },
      { modelName: 'DeepSeek Reasoner', modelId: 'deepseek-reasoner', inputCostPer1M: 0.14, outputCostPer1M: 2.19 }
    ]
  },
  fireworks: {
    serviceName: 'Fireworks AI',
    value: 'fireworks',
    label: 'Fireworks',
    models: [
      { modelName: 'LLAMA 3 1 405B', modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct', inputCostPer1M: 3.00, outputCostPer1M: 3.00 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct', inputCostPer1M: 0.90, outputCostPer1M: 0.90 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct', inputCostPer1M: 0.20, outputCostPer1M: 0.20 },
      { modelName: 'LLAMA 3 2 3B', modelId: 'accounts/fireworks/models/llama-v3p2-3b-instruct', inputCostPer1M: 0.10, outputCostPer1M: 0.10 },
      { modelName: 'QWEN 2 5 72B', modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct', inputCostPer1M: 0.90, outputCostPer1M: 0.90 }
    ]
  },
  together: {
    serviceName: 'Together AI',
    value: 'together',
    label: 'Together AI',
    models: [
      { modelName: 'LLAMA 3 2 3B', modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', inputCostPer1M: 0.06, outputCostPer1M: 0.06 },
      { modelName: 'LLAMA 3 1 405B', modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', inputCostPer1M: 3.50, outputCostPer1M: 3.50 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', inputCostPer1M: 0.88, outputCostPer1M: 0.88 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', inputCostPer1M: 0.18, outputCostPer1M: 0.18 },
      { modelName: 'Gemma 2 27B', modelId: 'google/gemma-2-27b-it', inputCostPer1M: 0.80, outputCostPer1M: 0.80 },
      { modelName: 'Gemma 2 9B', modelId: 'google/gemma-2-9b-it', inputCostPer1M: 0.30, outputCostPer1M: 0.30 },
      { modelName: 'QWEN 2 5 72B', modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo', inputCostPer1M: 1.20, outputCostPer1M: 1.20 },
      { modelName: 'QWEN 2 5 7B', modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo', inputCostPer1M: 0.30, outputCostPer1M: 0.30 }
    ]
  }
} as const