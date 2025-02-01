// shared/constants.ts

/**
 * @remarks
 * The Whisper model definitions include a `bin` property for the backend to reference
 * the required `.bin` files, while the frontend can simply use the `value` and `label`
 * for display and selection purposes.
 *
 */

import type { AssemblyModelType, DeepgramModelType } from '../src/utils/types/transcription'

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
export const WHISPER_MODELS: Array<{ value: string; label: string; bin: string }> = [
  { value: 'tiny', label: 'tiny', bin: 'ggml-tiny.bin' },
  { value: 'tiny.en', label: 'tiny.en', bin: 'ggml-tiny.en.bin' },
  { value: 'base', label: 'base', bin: 'ggml-base.bin' },
  { value: 'base.en', label: 'base.en', bin: 'ggml-base.en.bin' },
  { value: 'small', label: 'small', bin: 'ggml-small.bin' },
  { value: 'small.en', label: 'small.en', bin: 'ggml-small.en.bin' },
  { value: 'medium', label: 'medium', bin: 'ggml-medium.bin' },
  { value: 'medium.en', label: 'medium.en', bin: 'ggml-medium.en.bin' },
  { value: 'large-v1', label: 'large-v1', bin: 'ggml-large-v1.bin' },
  { value: 'large-v2', label: 'large-v2', bin: 'ggml-large-v2.bin' },
  { value: 'large-v3-turbo', label: 'large-v3-turbo', bin: 'ggml-large-v3-turbo.bin' },
  { value: 'turbo', label: 'turbo', bin: 'ggml-large-v3-turbo.bin' },
]

/**
 * All user-facing LLM services, unified for both backend and frontend usage.
 */
export const LLM_SERVICES: Array<{ value: string; label: string }> = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'deepseek', label: 'Deepseek' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'together', label: 'Together AI' },
  { value: 'groq', label: 'Groq' },
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
  cohere: [
    { value: 'command-r', label: 'Command R' },
    { value: 'command-r-plus', label: 'Command R Plus' },
  ],
  mistral: [
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7b' },
    { value: 'open-mixtral-8x22b', label: 'Mixtral 8x22b' },
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'open-mistral-nemo', label: 'Mistral Nemo' },
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
  groq: [
    { value: 'llama-3.1-70b-versatile', label: 'LLAMA 3.1 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'LLAMA 3.1 8B Instant' },
    { value: 'llama-3.2-1b-preview', label: 'LLAMA 3.2 1B Preview' },
    { value: 'llama-3.2-3b-preview', label: 'LLAMA 3.2 3B Preview' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7b 32768' },
  ],
} as const

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS: Record<
  DeepgramModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
  NOVA_2: {
    name: 'Nova-2',
    modelId: 'nova-2',
    costPerMinute: 0.0043,
  },
  NOVA: {
    name: 'Nova',
    modelId: 'nova',
    costPerMinute: 0.0043,
  },
  ENHANCED: {
    name: 'Enhanced',
    modelId: 'enhanced',
    costPerMinute: 0.0145,
  },
  BASE: {
    name: 'Base',
    modelId: 'base',
    costPerMinute: 0.0125,
  },
}

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS: Record<
  AssemblyModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
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