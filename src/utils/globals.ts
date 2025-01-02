// src/utils/globals.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { WhisperModelType, TranscriptServiceConfig } from '../types/transcription'
import type { ModelConfig, ChatGPTModelType, ClaudeModelType, CohereModelType, GeminiModelType, MistralModelType, OllamaModelType, TogetherModelType, FireworksModelType, GroqModelType, LLMServiceConfig, LLMServices } from '../types/llms'
import type { RequestBody } from '../types/process'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

/**
 * @description Override environment variables from CLI if the user has provided them.
 * This ensures that if keys are not in the .env file, they can be specified
 * via CLI arguments instead.
 */
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
  groqApiKey: 'GROQ_API_KEY'
}

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
  groqApiKey: 'GROQ_API_KEY'
}

/**
 * Configure XML parser for RSS feed processing
 * Handles attributes without prefixes and allows boolean values
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

export const PROMPT_CHOICES = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
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
 * Available action options for content processing with additional metadata
 * @type {{ name: string; value: string; message: string; validate: (input: string) => boolean | string }[]}
 */
export const ACTION_OPTIONS = [
  {
    name: 'video',
    description: 'Single YouTube Video',
    message: 'Enter the YouTube video URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.')
  },
  {
    name: 'playlist',
    description: 'YouTube Playlist',
    message: 'Enter the YouTube playlist URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.')
  },
  {
    name: 'channel',
    description: 'YouTube Channel',
    message: 'Enter the YouTube channel URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.')
  },
  {
    name: 'urls',
    description: 'List of URLs from File',
    message: 'Enter the file path containing URLs:',
    validate: (input: string) => (input ? true : 'Please enter a valid file path.')
  },
  {
    name: 'file',
    description: 'Local Audio/Video File',
    message: 'Enter the local audio/video file path:',
    validate: (input: string) => (input ? true : 'Please enter a valid file path.')
  },
  {
    name: 'rss',
    description: 'Podcast RSS Feed',
    message: 'Enter the podcast RSS feed URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.')
  }
]

export const PROCESS_CHOICES = [
  { name: 'Single YouTube Video', value: 'video' },
  { name: 'YouTube Playlist', value: 'playlist' },
  { name: 'YouTube Channel', value: 'channel' },
  { name: 'List of URLs from File', value: 'urls' },
  { name: 'Local Audio/Video File', value: 'file' },
  { name: 'Podcast RSS Feed', value: 'rss' },
]

export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

export const TRANSCRIPT_OPTIONS = Object.values(TRANSCRIPT_SERVICES)
  .map(service => service.value)

export const WHISPER_SERVICES = Object.values(TRANSCRIPT_SERVICES)
  .filter((service): service is TranscriptServiceConfig & { isWhisper: true } => 
    service.isWhisper === true
  )
  .map(service => service.value)

/**
 * Mapping of Whisper model types to their corresponding binary filenames for whisper.cpp.
 * @type {Record<WhisperModelType, string>}
 */
export const WHISPER_MODELS: Record<WhisperModelType, string> = {
  'tiny': 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',
  'base': 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',
  'small': 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  'medium': 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin',
  'large-v2': 'ggml-large-v2.bin',
  'large-v3-turbo': 'ggml-large-v3-turbo.bin',
  'turbo': 'ggml-large-v3-turbo.bin'
}

// Define lists of supported options
export const llmOptions = [
  'chatgpt',
  'claude',
  'cohere',
  'mistral',
  'ollama',
  'gemini',
  'fireworks',
  'together',
  'groq',
] as const

export const transcriptOptions = [
  'whisper',
  'whisperDocker',
  'deepgram',
  'assembly',
] as const

export const otherOptions = ['speakerLabels', 'prompt', 'noCleanUp', 'order', 'skip', 'info', 'item']

export const LLM_SERVICES: Record<string, LLMServiceConfig> = {
  SKIP: { name: 'Skip LLM Processing', value: null },
  OLLAMA: { name: 'Ollama (local inference)', value: 'ollama' },
  CHATGPT: { name: 'OpenAI ChatGPT', value: 'chatgpt' },
  CLAUDE: { name: 'Anthropic Claude', value: 'claude' },
  GEMINI: { name: 'Google Gemini', value: 'gemini' },
  COHERE: { name: 'Cohere', value: 'cohere' },
  MISTRAL: { name: 'Mistral', value: 'mistral' },
  FIREWORKS: { name: 'Fireworks AI', value: 'fireworks' },
  TOGETHER: { name: 'Together AI', value: 'together' },
  GROQ: { name: 'Groq', value: 'groq' },
} as const

export const LLM_OPTIONS = Object.values(LLM_SERVICES)
  .map(service => service.value)
  .filter((value): value is LLMServices => value !== null)

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