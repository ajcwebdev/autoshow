// src/types/globals.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import chalk from 'chalk'
import type { ChalkInstance } from 'chalk'
import type { TranscriptServices, LLMServices, WhisperModelType } from '../types/main'
import type { ChatGPTModelType, ClaudeModelType, CohereModelType, GeminiModelType, MistralModelType, OllamaModelType, TogetherModelType, FireworksModelType, GroqModelType } from '../types/llm-types'


export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

/**
 * Configure XML parser for RSS feed processing
 * Handles attributes without prefixes and allows boolean values
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/**
 * Chalk styling for step indicators in the CLI
 * @type {ChalkInstance}
 */
export const step: ChalkInstance = chalk.bold.underline

/**
 * Chalk styling for dimmed text
 * @type {ChalkInstance}
 */
export const dim: ChalkInstance = chalk.dim

/**
 * Chalk styling for success messages
 * @type {ChalkInstance}
 */
export const success: ChalkInstance = chalk.bold.blue

/**
 * Chalk styling for options display
 * @type {ChalkInstance}
 */
export const opts: ChalkInstance = chalk.magentaBright.bold

/**
 * Chalk styling for wait/processing messages
 * @type {ChalkInstance}
 */
export const wait: ChalkInstance = chalk.bold.cyan

/**
 * Chalk styling for final messages
 * @type {ChalkInstance}
 */
export const final: ChalkInstance = chalk.bold.italic

/**
 * Convenience export for console.log
 * @type {typeof console.log}
 */
export const l: typeof console.log = console.log

/**
 * Convenience export for console.error
 * @type {typeof console.log}
 */
export const err: typeof console.error = console.error

export const PROMPT_CHOICES = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'Blog', value: 'blog' },
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

type LLMServiceConfig = {
  name: string
  value: LLMServices | null
}

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

// Modify the type definition for TRANSCRIPT_SERVICES
type TranscriptServiceConfig = {
  name: string
  value: TranscriptServices
  isWhisper?: boolean
}

export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  WHISPER_DOCKER: { name: 'Whisper.cpp (Docker)', value: 'whisperDocker', isWhisper: true },
  WHISPER_PYTHON: { name: 'Whisper Python', value: 'whisperPython', isWhisper: true },
  WHISPER_DIARIZATION: { name: 'Whisper Diarization', value: 'whisperDiarization', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

export const LLM_OPTIONS = Object.values(LLM_SERVICES)
  .map(service => service.value)
  .filter((value): value is LLMServices => value !== null)

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

/**
 * Ollama model configuration with both display names and model identifiers
 * @type {Record<OllamaModelType, { name: string, modelId: string }>}
 */
export const OLLAMA_MODELS: Record<OllamaModelType, { name: string, modelId: string }> = {
  LLAMA_3_2_1B: { name: 'LLAMA 3 2 1B', modelId: 'llama3.2:1b' },
  LLAMA_3_2_3B: { name: 'LLAMA 3 2 3B', modelId: 'llama3.2:3b' },
  GEMMA_2_2B: { name: 'GEMMA 2 2B', modelId: 'gemma2:2b' },
  PHI_3_5: { name: 'PHI 3 5', modelId: 'phi3.5:3.8b' },
  QWEN_2_5_1B: { name: 'QWEN 2 5 1B', modelId: 'qwen2.5:1.5b' },
  QWEN_2_5_3B: { name: 'QWEN 2 5 3B', modelId: 'qwen2.5:3b' },
}

/**
 * Unified ChatGPT model configuration with both display names and model identifiers
 * @type {Record<ChatGPTModelType, { name: string, modelId: string }>}
 */
export const GPT_MODELS: Record<ChatGPTModelType, { name: string, modelId: string }> = {
  GPT_4o_MINI: { name: 'GPT 4 o MINI', modelId: 'gpt-4o-mini' },
  GPT_4o: { name: 'GPT 4 o', modelId: 'gpt-4o' },
  GPT_4_TURBO: { name: 'GPT 4 TURBO', modelId: 'gpt-4-turbo' },
  GPT_4: { name: 'GPT 4', modelId: 'gpt-4' },
}

/**
 * Unified Claude model configuration with both display names and model identifiers
 * @type {Record<ClaudeModelType, { name: string, modelId: string }>}
 */
export const CLAUDE_MODELS: Record<ClaudeModelType, { name: string, modelId: string }> = {
  CLAUDE_3_5_SONNET: { name: 'Claude 3.5 Sonnet', modelId: 'claude-3-5-sonnet-20240620' },
  CLAUDE_3_OPUS: { name: 'Claude 3 Opus', modelId: 'claude-3-opus-20240229' },
  CLAUDE_3_SONNET: { name: 'Claude 3 Sonnet', modelId: 'claude-3-sonnet-20240229' },
  CLAUDE_3_HAIKU: { name: 'Claude 3 Haiku', modelId: 'claude-3-haiku-20240307' },
}

/**
 * Unified Gemini model configuration with both display names and model identifiers
 * @type {Record<GeminiModelType, { name: string, modelId: string }>}
 */
export const GEMINI_MODELS: Record<GeminiModelType, { name: string, modelId: string }> = {
  GEMINI_1_5_FLASH: { name: 'Gemini 1.5 Flash', modelId: 'gemini-1.5-flash' },
  GEMINI_1_5_PRO: { name: 'Gemini 1.5 Pro', modelId: 'gemini-1.5-pro-exp-0827' },
}

/**
* Unified Cohere model configuration with both display names and model identifiers
* @type {Record<CohereModelType, { name: string, modelId: string }>}
*/
export const COHERE_MODELS: Record<CohereModelType, { name: string, modelId: string }> = {
 COMMAND_R: { name: 'Command R', modelId: 'command-r' },
 COMMAND_R_PLUS: { name: 'Command R Plus', modelId: 'command-r-plus' },
}

/**
* Unified Mistral model configuration with both display names and model identifiers
* @type {Record<MistralModelType, { name: string, modelId: string }>}
*/
export const MISTRAL_MODELS: Record<MistralModelType, { name: string, modelId: string }> = {
 MIXTRAL_8x7b: { name: 'Mixtral 8x7b', modelId: 'open-mixtral-8x7b' },
 MIXTRAL_8x22b: { name: 'Mixtral 8x22b', modelId: 'open-mixtral-8x22b' },
 MISTRAL_LARGE: { name: 'Mistral Large', modelId: 'mistral-large-latest' },
 MISTRAL_NEMO: { name: 'Mistral Nemo', modelId: 'open-mistral-nemo' },
}

/**
* Unified Fireworks model configuration with both display names and model identifiers
* @type {Record<FireworksModelType, { name: string, modelId: string }>}
*/
export const FIREWORKS_MODELS: Record<FireworksModelType, { name: string, modelId: string }> = {
 LLAMA_3_1_405B: { name: 'LLAMA 3 1 405B', modelId: 'accounts/fireworks/models/llama-v3p1-405b-instruct' },
 LLAMA_3_1_70B: { name: 'LLAMA 3 1 70B', modelId: 'accounts/fireworks/models/llama-v3p1-70b-instruct' },
 LLAMA_3_1_8B: { name: 'LLAMA 3 1 8B', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct' },
 LLAMA_3_2_3B: { name: 'LLAMA 3 2 3B', modelId: 'accounts/fireworks/models/llama-v3p2-3b-instruct' },
 LLAMA_3_2_1B: { name: 'LLAMA 3 2 1B', modelId: 'accounts/fireworks/models/llama-v3p2-1b-instruct' },
 QWEN_2_5_72B: { name: 'QWEN 2 5 72B', modelId: 'accounts/fireworks/models/qwen2p5-72b-instruct' },
}

/**
* Unified Together model configuration with both display names and model identifiers
* @type {Record<TogetherModelType, { name: string, modelId: string }>}
*/
export const TOGETHER_MODELS: Record<TogetherModelType, { name: string, modelId: string }> = {
 LLAMA_3_2_3B: { name: 'LLAMA 3 2 3B', modelId: 'meta-llama/Llama-3.2-3B-Instruct-Turbo' },
 LLAMA_3_1_405B: { name: 'LLAMA 3 1 405B', modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo' },
 LLAMA_3_1_70B: { name: 'LLAMA 3 1 70B', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
 LLAMA_3_1_8B: { name: 'LLAMA 3 1 8B', modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
 GEMMA_2_27B: { name: 'Gemma 2 27B', modelId: 'google/gemma-2-27b-it' },
 GEMMA_2_9B: { name: 'Gemma 2 9B', modelId: 'google/gemma-2-9b-it' },
 QWEN_2_5_72B: { name: 'QWEN 2 5 72B', modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo' },
 QWEN_2_5_7B: { name: 'QWEN 2 5 7B', modelId: 'Qwen/Qwen2.5-7B-Instruct-Turbo' },
}

/**
* Unified Groq model configuration with both display names and model identifiers
* @type {Record<GroqModelType, { name: string, modelId: string }>}
*/
export const GROQ_MODELS: Record<GroqModelType, { name: string, modelId: string }> = {
 LLAMA_3_1_70B_VERSATILE: { name: 'LLAMA 3 1 70B Versatile', modelId: 'llama-3.1-70b-versatile' },
 LLAMA_3_1_8B_INSTANT: { name: 'LLAMA 3 1 8B Instant', modelId: 'llama-3.1-8b-instant' },
 LLAMA_3_2_1B_PREVIEW: { name: 'LLAMA 3 2 1B Preview', modelId: 'llama-3.2-1b-preview' },
 LLAMA_3_2_3B_PREVIEW: { name: 'LLAMA 3 2 3B Preview', modelId: 'llama-3.2-3b-preview' },
 MIXTRAL_8X7B_32768: { name: 'Mixtral 8x7b 32768', modelId: 'mixtral-8x7b-32768' },
}