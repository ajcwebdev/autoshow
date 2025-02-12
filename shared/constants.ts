// shared/constants.ts

/**
 * @remarks
 * The Whisper model definitions include a `bin` property for the backend to reference
 * the required `.bin` files, while the frontend can simply use the `value` and `label`
 * for display and selection purposes.
 *
 */

import type { AssemblyModelType, DeepgramModelType } from '../src/utils/types/transcription'
import type { LLMServices } from '../src/utils/types/llms'

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

/**
 * All user-facing transcription services, unified for both backend and frontend usage.
 */
export const TRANSCRIPTION_SERVICES: Array<{ value: string; label: string }> = [
  { value: 'whisper', label: 'Whisper.cpp' },
  { value: 'deepgram', label: 'Deepgram' },
  { value: 'assembly', label: 'AssemblyAI' },
]

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
 * Mapping of available LLM providers and their configuration.
 * A value of `null` indicates an option to skip LLM processing.
 * 
 */
export const LLM_SERVICE_OPTIONS = {
  SKIP: { name: 'Skip LLM Processing', value: null },
  OLLAMA: { name: 'Ollama (local inference)', value: 'ollama' },
  CHATGPT: { name: 'OpenAI ChatGPT', value: 'chatgpt' },
  CLAUDE: { name: 'Anthropic Claude', value: 'claude' },
  GEMINI: { name: 'Google Gemini', value: 'gemini' },
  DEEPSEEK: { name: 'DeepSeek', value: 'deepseek' },
  FIREWORKS: { name: 'Fireworks AI', value: 'fireworks' },
  TOGETHER: { name: 'Together AI', value: 'together' },
} as const

/**
 * Array of valid LLM service values (excluding the "SKIP" option).
 * 
 */
export const LLM_OPTIONS: LLMServices[] = Object.values(LLM_SERVICE_OPTIONS)
  .map((service) => service.value)
  .filter((value): value is LLMServices => value !== null)

/**
 * All user-facing LLM services, unified for both backend and frontend usage.
 */
export const LLM_SERVICES: Array<{ value: string; label: string }> = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'deepseek', label: 'Deepseek' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'together', label: 'Together AI' },
]

/**
 * All user-facing model choices for each LLM service, unified for both backend
 * and frontend usage. The backend can reference these for validation or default
 * selection logic, while the frontend uses them to populate model dropdowns.
 */
export const LLM_MODELS = {
  ollama: [
    { value: 'deepseek-r1:1.5b', label: 'DEEPSEEK R1 1.5B' },
    { value: 'qwen2.5:0.5b', label: 'QWEN 2 5 0B' },
    { value: 'qwen2.5:1.5b', label: 'QWEN 2.5 1.5B' },
    { value: 'qwen2.5:3b', label: 'QWEN 2.5 3B' },
    { value: 'llama3.2:1b', label: 'LLAMA 3.2 1B' },
    { value: 'llama3.2:3b', label: 'LLAMA 3.2 3B' },
    { value: 'gemma2:2b', label: 'GEMMA 2 2B' },
    { value: 'phi3.5:3.8b', label: 'PHI 3.5' },
  ],
  chatgpt: [
    { value: 'gpt-4o-mini', label: 'GPT 4o Mini' },
    { value: 'gpt-4o', label: 'GPT 4o' },
    { value: 'o1-mini', label: 'GPT o1 MINI' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro-exp-0827', label: 'Gemini 1.5 Pro' },
  ],
  fireworks: [
    { value: 'accounts/fireworks/models/llama-v3p1-405b-instruct', label: 'LLAMA 3.1 405B' },
    { value: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'LLAMA 3.1 70B' },
    { value: 'accounts/fireworks/models/llama-v3p1-8b-instruct', label: 'LLAMA 3.1 8B' },
    { value: 'accounts/fireworks/models/llama-v3p2-3b-instruct', label: 'LLAMA 3.2 3B' },
    { value: 'accounts/fireworks/models/llama-v3p2-1b-instruct', label: 'LLAMA 3.2 1B' },
    { value: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'QWEN 2.5 72B' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', label: 'LLAMA 3.2 3B' },
    { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'LLAMA 3.1 405B' },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'LLAMA 3.1 70B' },
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'LLAMA 3.1 8B' },
    { value: 'google/gemma-2-27b-it', label: 'Gemma 2 27B' },
    { value: 'google/gemma-2-9b-it', label: 'Gemma 2 9B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'QWEN 2.5 72B' },
    { value: 'Qwen/Qwen2.5-7B-Instruct-Turbo', label: 'QWEN 2.5 7B' },
  ],
} as const

/**
 * Configuration for ChatGPT models, mapping model types to their display names and identifiers.
 * Includes various GPT-4 models with different capabilities and performance characteristics.
 */
export const GPT_MODELS = {
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
 */
export const CLAUDE_MODELS = {
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
 */
export const GEMINI_MODELS = {
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
 * Configuration for Fireworks AI models, mapping model types to their display names and identifiers.
 * Features various LLaMA and Qwen models optimized for different use cases.
 */
export const FIREWORKS_MODELS = {
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
 */
export const TOGETHER_MODELS = {
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
 * Configuration for DeepSeek models, mapping model types to their display names and identifiers.
 * Pricing is based on publicly listed rates for DeepSeek. 
 */
export const DEEPSEEK_MODELS = {
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
export const ALL_MODELS = {
  ...GPT_MODELS,
  ...CLAUDE_MODELS,
  ...GEMINI_MODELS,
  ...DEEPSEEK_MODELS,
  ...FIREWORKS_MODELS,
  ...TOGETHER_MODELS,
}

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS: Record<DeepgramModelType, { name: string; modelId: string; costPerMinute: number }> = {
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
}

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS: Record<AssemblyModelType, { name: string; modelId: string; costPerMinute: number }> = {
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
}