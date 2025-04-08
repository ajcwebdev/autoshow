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
 * @typedef {object} TranscriptionModel
 * @property {string} modelId - The model's unique identifier (e.g., 'tiny', 'nova-2')
 * @property {number} costPerMinuteCents - The cost per minute in cents
 */

/**
 * Configuration object for transcription service providers, including their available models
 * and relevant cost data.
 *
 * @typedef {object} TranscriptionServiceConfig
 * @property {string} serviceName - The service's display name
 * @property {string} value - The internal value or key for the service
 * @property {string} label - The user-facing label for the service
 * @property {Array<TranscriptionModel>} models - The models available under this service
 */
export const T_CONFIG = {
  whisper: {
    serviceName: 'Whisper.cpp',
    value: 'whisper',
    label: 'Whisper.cpp',
    models: [
      { modelId: 'tiny', costPerMinuteCents: 0 },
      { modelId: 'tiny.en', costPerMinuteCents: 0 },
      { modelId: 'base', costPerMinuteCents: 0 },
      { modelId: 'base.en', costPerMinuteCents: 0 },
      { modelId: 'small', costPerMinuteCents: 0 },
      { modelId: 'small.en', costPerMinuteCents: 0 },
      { modelId: 'medium', costPerMinuteCents: 0 },
      { modelId: 'medium.en', costPerMinuteCents: 0 },
      { modelId: 'large-v1', costPerMinuteCents: 0 },
      { modelId: 'large-v2', costPerMinuteCents: 0 },
      { modelId: 'large-v3-turbo', costPerMinuteCents: 0 },
      { modelId: 'turbo', costPerMinuteCents: 0 },
    ]
  },
  deepgram: {
    serviceName: 'Deepgram',
    value: 'deepgram',
    label: 'Deepgram',
    models: [
      { modelId: 'nova-2', costPerMinuteCents: 0.43 },
      { modelId: 'base', costPerMinuteCents: 1.25 },
      { modelId: 'enhanced', costPerMinuteCents: 1.45 },
    ]
  },
  assembly: {
    serviceName: 'AssemblyAI',
    value: 'assembly',
    label: 'AssemblyAI',
    models: [
      { modelId: 'best', costPerMinuteCents: 0.62 },
      { modelId: 'nano', costPerMinuteCents: 0.2 },
    ]
  },
} as const

/**
 * Configuration object for an individual LLM model.
 *
 * @typedef {Object} LLMModel
 * @property {string} modelName - Display name of the model
 * @property {string} modelId - Unique identifier for the model
 * @property {number} [inputCostD] - Legacy input cost per 1M tokens in dollars
 * @property {number} [outputCostD] - Legacy output cost per 1M tokens in dollars
 * @property {number} [inputCostC] - New input cost per 1M tokens in cents
 * @property {number} [outputCostC] - New output cost per 1M tokens in cents
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
 * @property {string} [apiKeyPropName] - The request body property name for the API key
 * @property {Array<LLMModel>} models - The models available under this service
 */
export const L_CONFIG = {
  skip: {
    serviceName: 'Skip LLM Processing',
    value: null,
    label: 'Skip LLM Processing',
    models: []
  },
  chatgpt: {
    serviceName: 'OpenAI ChatGPT',
    value: 'chatgpt',
    label: 'ChatGPT',
    apiKeyPropName: 'openaiApiKey',
    models: [
      { modelName: 'GPT 4.5 PREVIEW', modelId: 'gpt-4.5-preview', inputCostD: 75.00, outputCostD: 150.00, inputCostC: 7500, outputCostC: 15000 },
      { modelName: 'GPT 4o', modelId: 'gpt-4o', inputCostD: 2.50, outputCostD: 10.00, inputCostC: 250, outputCostC: 1000 },
      { modelName: 'GPT 4o MINI', modelId: 'gpt-4o-mini', inputCostD: 0.15, outputCostD: 0.60, inputCostC: 15, outputCostC: 60 },
      { modelName: 'GPT o1 MINI', modelId: 'o1-mini', inputCostD: 1.10, outputCostD: 4.40, inputCostC: 110, outputCostC: 440 }
    ]
  },
  claude: {
    serviceName: 'Anthropic Claude',
    value: 'claude',
    label: 'Claude',
    apiKeyPropName: 'anthropicApiKey',
    models: [
      { modelName: 'Claude 3.7 Sonnet', modelId: 'claude-3-7-sonnet-latest', inputCostD: 3.00, outputCostD: 15.00, inputCostC: 300, outputCostC: 1500 },
      { modelName: 'Claude 3.5 Haiku', modelId: 'claude-3-5-haiku-latest', inputCostD: 0.80, outputCostD: 4.00, inputCostC: 80, outputCostC: 400 },
      { modelName: 'Claude 3 Opus', modelId: 'claude-3-opus-latest', inputCostD: 15.00, outputCostD: 75.00, inputCostC: 1500, outputCostC: 7500 },
    ]
  },
  gemini: {
    serviceName: 'Google Gemini',
    value: 'gemini',
    label: 'Gemini',
    apiKeyPropName: 'geminiApiKey',
    models: [
      { modelName: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro', inputCostD: 2.50, outputCostD: 10.00, inputCostC: 250, outputCostC: 1000 },
      { modelName: 'Gemini 1.5 Flash-8B', modelId: 'gemini-1.5-flash-8b', inputCostD: 0.075, outputCostD: 0.30, inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash', inputCostD: 0.15, outputCostD: 0.60, inputCostC: 15, outputCostC: 60 },
      { modelName: 'Gemini 2.0 Flash-Lite', modelId: 'gemini-2.0-flash-lite', inputCostD: 0.075, outputCostD: 0.30, inputCostC: 7.5, outputCostC: 30 },
      { modelName: 'Gemini 2.0 Flash', modelId: 'gemini-2.0-flash', inputCostD: 0.10, outputCostD: 0.40, inputCostC: 10, outputCostC: 40 },
    ]
  },
  deepseek: {
    serviceName: 'DeepSeek',
    value: 'deepseek',
    label: 'Deepseek',
    apiKeyPropName: 'deepseekApiKey',
    models: [
      { modelName: 'DeepSeek Chat', modelId: 'deepseek-chat', inputCostD: 0.07, outputCostD: 1.10, inputCostC: 7, outputCostC: 110 },
      { modelName: 'DeepSeek Reasoner', modelId: 'deepseek-reasoner', inputCostD: 0.14, outputCostD: 2.19, inputCostC: 14, outputCostC: 219 },
    ]
  },
  fireworks: {
    serviceName: 'Fireworks AI',
    value: 'fireworks',
    label: 'Fireworks',
    apiKeyPropName: 'fireworksApiKey',
    models: [
      { modelName: 'LLAMA 3 1 405B', modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct', inputCostD: 3.00, outputCostD: 3.00, inputCostC: 300, outputCostC: 300 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct', inputCostD: 0.90, outputCostD: 0.90, inputCostC: 90, outputCostC: 90 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct', inputCostD: 0.20, outputCostD: 0.20, inputCostC: 20, outputCostC: 20 },
      { modelName: 'QWEN 2 5 72B', modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct', inputCostD: 0.90, outputCostD: 0.90, inputCostC: 90, outputCostC: 90 },
    ]
  },
  together: {
    serviceName: 'Together AI',
    value: 'together',
    label: 'Together AI',
    apiKeyPropName: 'togetherApiKey',
    models: [
      { modelName: 'LLAMA 3 2 3B', modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', inputCostD: 0.06, outputCostD: 0.06, inputCostC: 6, outputCostC: 6 },
      { modelName: 'LLAMA 3 1 405B', modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', inputCostD: 3.50, outputCostD: 3.50, inputCostC: 350, outputCostC: 350 },
      { modelName: 'LLAMA 3 1 70B', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', inputCostD: 0.88, outputCostD: 0.88, inputCostC: 88, outputCostC: 88 },
      { modelName: 'LLAMA 3 1 8B', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', inputCostD: 0.18, outputCostD: 0.18, inputCostC: 18, outputCostC: 18 },
      { modelName: 'Gemma 2 27B', modelId: 'google/gemma-2-27b-it', inputCostD: 0.80, outputCostD: 0.80, inputCostC: 80, outputCostC: 80 },
      { modelName: 'Gemma 2 9B', modelId: 'google/gemma-2-9b-it', inputCostD: 0.30, outputCostD: 0.30, inputCostC: 30, outputCostC: 30 },
      { modelName: 'QWEN 2 5 72B', modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo', inputCostD: 1.20, outputCostD: 1.20, inputCostC: 120, outputCostC: 120 },
      { modelName: 'QWEN 2 5 7B', modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo', inputCostD: 0.30, outputCostD: 0.30, inputCostC: 30, outputCostC: 30 },
    ]
  }
} as const