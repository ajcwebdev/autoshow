// shared/constants.ts

/**
 * Map of environment variable keys to their corresponding system environment names.
 *
 * @typedef {Object} EnvVarsMap
 * @property {string} openaiApiKey - The environment variable for the OpenAI API key
 * @property {string} anthropicApiKey - The environment variable for the Anthropic API key
 * @property {string} deepgramApiKey - The environment variable for the Deepgram API key
 * @property {string} assemblyApiKey - The environment variable for the AssemblyAI API key
 * @property {string} geminiApiKey - The environment variable for the Google Gemini API key
 * @property {string} deepseekApiKey - The environment variable for the DeepSeek API key
 * @property {string} togetherApiKey - The environment variable for the Together AI API key
 * @property {string} fireworksApiKey - The environment variable for the Fireworks AI API key
 */
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

/**
 * List of possible process types for user files.
 *
 * @typedef {Object} ProcessType
 * @property {string} value - The internal value (e.g., 'video', 'file')
 * @property {string} label - The user-facing label
 */
export const PROCESS_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'file', label: 'File' },
] as const

/**
 * Represents a single prompt choice option.
 *
 * @typedef {Object} PromptChoice
 * @property {string} name - Display name of the prompt choice
 * @property {string} value - Internal value used for the prompt choice
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
 * Configuration object for an individual transcription model.
 *
 * @typedef {Object} TranscriptionModel
 * @property {string} [name] - (Optional) Display name of the model
 * @property {string} modelId - Unique identifier for the model
 * @property {number} [costPerMinuteCents] - New cost-per-minute in cents
 */

/**
 * Configuration object for transcription service providers, including their available models
 * and relevant cost data. Dollar-based fields remain for backward compatibility; new `cents` fields
 * should be used for all cost calculations going forward.
 *
 * @typedef {Object} TranscriptionServiceConfig
 * @property {string} serviceName - The service's display name
 * @property {string} value - The internal value or key for the service
 * @property {string} label - The user-facing label for the service
 * @property {Array<TranscriptionModel>} models - The models available under this service
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
      { name: 'Nova-2', modelId: 'nova-2', costPerMinuteCents: 0.43 },
      { name: 'Base', modelId: 'base', costPerMinuteCents: 1.25 },
      { name: 'Enhanced', modelId: 'enhanced', costPerMinuteCents: 1.45 },
    ]
  },
  assembly: {
    serviceName: 'AssemblyAI',
    value: 'assembly',
    label: 'AssemblyAI',
    models: [
      { name: 'Best', modelId: 'best', costPerMinuteCents: 0.62 },
      { name: 'Nano', modelId: 'nano', costPerMinuteCents: 0.2 },
    ]
  },
} as const

/**
 * Configuration object for an individual LLM model.
 *
 * @typedef {Object} LLMModel
 * @property {string} modelName - Display name of the model
 * @property {string} modelId - Unique identifier for the model
 * @property {number} [inputCostPer1M] - Legacy input cost per 1M tokens in dollars
 * @property {number} [outputCostPer1M] - Legacy output cost per 1M tokens in dollars
 * @property {number} [inputCostPer1MCents] - New input cost per 1M tokens in cents
 * @property {number} [outputCostPer1MCents] - New output cost per 1M tokens in cents
 */

/**
 * Configuration object for LLM service providers, including their available models
 * and relevant cost data. Dollar-based fields remain for backward compatibility; new `cents` fields
 * should be used for all cost calculations going forward.
 *
 * @typedef {Object} LLMServiceConfig
 * @property {string} serviceName - The service's display name
 * @property {string|null} value - The internal value or key for the service
 * @property {string} label - The user-facing label for the service
 * @property {Array<LLMModel>} models - The models available under this service
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
      { modelName: 'QWEN 2 5 0B', modelId: 'qwen2.5:0.5b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'QWEN 2.5 1.5B', modelId: 'qwen2.5:1.5b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'QWEN 2.5 3B', modelId: 'qwen2.5:3b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'LLAMA 3.2 1B', modelId: 'llama3.2:1b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'LLAMA 3.2 3B', modelId: 'llama3.2:3b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'GEMMA 2 2B', modelId: 'gemma2:2b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'PHI 3.5', modelId: 'phi3.5:3.8b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
      { modelName: 'DEEPSEEK R1 1.5B', modelId: 'deepseek-r1:1.5b', inputCostPer1M: 0, outputCostPer1M: 0, inputCostPer1MCents: 0, outputCostPer1MCents: 0 },
    ]
  },
  chatgpt: {
    serviceName: 'OpenAI ChatGPT',
    value: 'chatgpt',
    label: 'ChatGPT',
    models: [
      { modelName: 'GPT 4.5 PREVIEW', modelId: 'gpt-4.5-preview', inputCostPer1M: 75.00, outputCostPer1M: 150.00, inputCostPer1MCents: 7500, outputCostPer1MCents: 15000 },
      { modelName: 'GPT 4o', modelId: 'gpt-4o', inputCostPer1M: 2.50, outputCostPer1M: 10.00, inputCostPer1MCents: 250, outputCostPer1MCents: 1000 },
      { modelName: 'GPT 4o MINI', modelId: 'gpt-4o-mini', inputCostPer1M: 0.15, outputCostPer1M: 0.60, inputCostPer1MCents: 15, outputCostPer1MCents: 60 },
      { modelName: 'GPT o1 MINI', modelId: 'o1-mini', inputCostPer1M: 1.10, outputCostPer1M: 4.40, inputCostPer1MCents: 110, outputCostPer1MCents: 440 }
    ]
  },
  claude: {
    serviceName: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    models: [
      { modelName: 'Claude 3.7 Sonnet', modelId: 'claude-3-7-sonnet-latest', inputCostPer1M: 3.00, outputCostPer1M: 15.00, inputCostPer1MCents: 300, outputCostPer1MCents: 1500 },
      { modelName: 'Claude 3.5 Haiku', modelId: 'claude-3-5-haiku-latest', inputCostPer1M: 0.80, outputCostPer1M: 4.00, inputCostPer1MCents: 80, outputCostPer1MCents: 400 },
      { modelName: 'Claude 3 Opus', modelId: 'claude-3-opus-latest', inputCostPer1M: 15.00, outputCostPer1M: 75.00, inputCostPer1MCents: 1500, outputCostPer1MCents: 7500 },
    ]
  },
  gemini: {
    serviceName: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    models: [
      { modelName: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro', inputCostPer1M: 2.50, outputCostPer1M: 10.00, inputCostPer1MCents: 250, outputCostPer1MCents: 1000 },
      { modelName: 'Gemini 1.5 Flash-8B', modelId: 'gemini-1.5-flash-8b', inputCostPer1M: 0.075, outputCostPer1M: 0.30, inputCostPer1MCents: 7.5, outputCostPer1MCents: 30 },
      { modelName: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash', inputCostPer1M: 0.15, outputCostPer1M: 0.60, inputCostPer1MCents: 15, outputCostPer1MCents: 60 },
      { modelName: 'Gemini 2.0 Flash-Lite', modelId: 'gemini-2.0-flash-lite', inputCostPer1M: 0.075, outputCostPer1M: 0.30, inputCostPer1MCents: 7.5, outputCostPer1MCents: 30 },
      { modelName: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', inputCostPer1M: 0.10, outputCostPer1M: 0.40, inputCostPer1MCents: 10, outputCostPer1MCents: 40 },
    ]
  },
  deepseek: {
    serviceName: 'DeepSeek',
    value: 'deepseek',
    label: 'Deepseek',
    models: [
      { modelName: 'DeepSeek Chat', modelId: 'deepseek-chat', inputCostPer1M: 0.07, outputCostPer1M: 1.10, inputCostPer1MCents: 7, outputCostPer1MCents: 110 },
      { modelName: 'DeepSeek Reasoner', modelId: 'deepseek-reasoner', inputCostPer1M: 0.14, outputCostPer1M: 2.19, inputCostPer1MCents: 14, outputCostPer1MCents: 219 },
    ]
  },
  fireworks: {
    serviceName: 'Fireworks AI',
    value: 'fireworks',
    label: 'Fireworks',
    models: [
      { modelName: 'LLAMA 3 1 405B', modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct', inputCostPer1M: 3.00, outputCostPer1M: 3.00, inputCostPer1MCents: 300, outputCostPer1MCents: 300 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct', inputCostPer1M: 0.90, outputCostPer1M: 0.90, inputCostPer1MCents: 90, outputCostPer1MCents: 90 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct', inputCostPer1M: 0.20, outputCostPer1M: 0.20, inputCostPer1MCents: 20, outputCostPer1MCents: 20 },
      { modelName: 'LLAMA 3 2 3B', modelId: 'accounts/fireworks/models/llama-v3p2-3b-instruct', inputCostPer1M: 0.10, outputCostPer1M: 0.10, inputCostPer1MCents: 10, outputCostPer1MCents: 10 },
      { modelName: 'QWEN 2 5 72B', modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct', inputCostPer1M: 0.90, outputCostPer1M: 0.90, inputCostPer1MCents: 90, outputCostPer1MCents: 90 },
    ]
  },
  together: {
    serviceName: 'Together AI',
    value: 'together',
    label: 'Together AI',
    models: [
      { modelName: 'LLAMA 3 2 3B', modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', inputCostPer1M: 0.06, outputCostPer1M: 0.06, inputCostPer1MCents: 6, outputCostPer1MCents: 6 },
      { modelName: 'LLAMA 3 1 405B', modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', inputCostPer1M: 3.50, outputCostPer1M: 3.50, inputCostPer1MCents: 350, outputCostPer1MCents: 350 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', inputCostPer1M: 0.88, outputCostPer1M: 0.88, inputCostPer1MCents: 88, outputCostPer1MCents: 88 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', inputCostPer1M: 0.18, outputCostPer1M: 0.18, inputCostPer1MCents: 18, outputCostPer1MCents: 18 },
      { modelName: 'Gemma 2 27B', modelId: 'google/gemma-2-27b-it', inputCostPer1M: 0.80, outputCostPer1M: 0.80, inputCostPer1MCents: 80, outputCostPer1MCents: 80 },
      { modelName: 'Gemma 2 9B', modelId: 'google/gemma-2-9b-it', inputCostPer1M: 0.30, outputCostPer1M: 0.30, inputCostPer1MCents: 30, outputCostPer1MCents: 30 },
      { modelName: 'QWEN 2 5 72B', modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo', inputCostPer1M: 1.20, outputCostPer1M: 1.20, inputCostPer1MCents: 120, outputCostPer1MCents: 120 },
      { modelName: 'QWEN 2 5 7B', modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo', inputCostPer1M: 0.30, outputCostPer1M: 0.30, inputCostPer1MCents: 30, outputCostPer1MCents: 30 },
    ]
  }
} as const