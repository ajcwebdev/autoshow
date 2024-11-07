// src/models.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import chalk from 'chalk'
import type { ChalkInstance } from 'chalk'
import type {
  WhisperModelType, ChatGPTModelType, ClaudeModelType, CohereModelType, GeminiModelType, MistralModelType, OllamaModelType, TogetherModelType, FireworksModelType, GroqModelType
} from './types.js'

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

/**
 * Available LLM service options
 * @type {string[]}
 */
export const LLM_OPTIONS = ['chatgpt', 'claude', 'cohere', 'mistral', 'ollama', 'gemini', 'fireworks', 'together', 'groq']

export const LLM_CHOICES = [
  'ollama',
  'chatgpt',
  'claude',
  'cohere',
  'mistral',
  'fireworks',
  'together',
  'groq',
  'gemini',
]

export const LLM_SERVICE_CHOICES = [
  { name: 'Skip LLM Processing', value: null },
  { name: 'Ollama (local inference)', value: 'ollama' },
  { name: 'OpenAI ChatGPT', value: 'chatgpt' },
  { name: 'Anthropic Claude', value: 'claude' },
  { name: 'Google Gemini', value: 'gemini' },
  { name: 'Cohere', value: 'cohere' },
  { name: 'Mistral', value: 'mistral' },
  { name: 'Fireworks AI', value: 'fireworks' },
  { name: 'Together AI', value: 'together' },
  { name: 'Groq', value: 'groq' },
]

/**
 * Available transcription service options
 * @type {string[]}
 */
export const TRANSCRIPT_OPTIONS = ['whisper', 'whisperDocker', 'whisperPython', 'whisperDiarization', 'deepgram', 'assembly']

export const TRANSCRIPT_CHOICES = [
  { name: 'Whisper.cpp', value: 'whisper' },
  { name: 'Whisper.cpp (Docker)', value: 'whisperDocker' },
  { name: 'Whisper Python', value: 'whisperPython' },
  { name: 'Whisper Diarization', value: 'whisperDiarization' },
  { name: 'Deepgram', value: 'deepgram' },
  { name: 'AssemblyAI', value: 'assembly' },
]

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

export const WHISPER_MODEL_CHOICES = [
  'tiny',
  'tiny.en',
  'base',
  'base.en',
  'small',
  'small.en',
  'medium',
  'medium.en',
  'large-v1',
  'large-v2',
  'turbo',
]

export const WHISPER_LIBRARY_CHOICES = [
  'whisper',
  'whisperDocker',
  'whisperPython',
  'whisperDiarization'
]

/**
 * Mapping of Whisper model types to their corresponding names for openai-whisper.
 * @type {Record<WhisperModelType, string>}
 */
export const WHISPER_PYTHON_MODELS: Record<WhisperModelType, string> = {
  tiny: 'tiny',
  'tiny.en': 'tiny.en',
  base: 'base',
  'base.en': 'base.en',
  small: 'small',
  'small.en': 'small.en',
  medium: 'medium',
  'medium.en': 'medium.en',
  'large-v1': 'large-v1',
  'large-v2': 'large-v2',
  turbo: 'turbo',
  'large-v3-turbo': 'large-v3-turbo'
}

/**
 * Mapping of model identifiers to their corresponding names in Ollama.
 * @type {Record<OllamaModelType, string>}
 */
export const OLLAMA_MODELS: Record<OllamaModelType, string> = {
  LLAMA_3_2_1B: 'llama3.2:1b',
  LLAMA_3_2_3B: 'llama3.2:3b',
  GEMMA_2_2B: 'gemma2:2b',
  PHI_3_5: 'phi3.5:3.8b',
  QWEN_2_5_1B: 'qwen2.5:1.5b',
  QWEN_2_5_3B: 'qwen2.5:3b',
}

export const OLLAMA_CHOICES = [
  { name: 'LLAMA 3 2 1B', value: 'LLAMA_3_2_1B' },
  { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
  { name: 'GEMMA 2 2B', value: 'GEMMA_2_2B' },
  { name: 'PHI 3 5', value: 'PHI_3_5' },
  { name: 'QWEN 2 5 1B', value: 'QWEN_2_5_1B' },
  { name: 'QWEN 2 5 3B', value: 'QWEN_2_5_3B' },
]

/**
 * Mapping of ChatGPT model identifiers to their API names.
 * @type {Record<ChatGPTModelType, string>}
 */
export const GPT_MODELS: Record<ChatGPTModelType, string> = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

export const CHATGPT_CHOICES = [
  { name: 'GPT 4 o MINI', value: 'GPT_4o_MINI' },
  { name: 'GPT 4 o', value: 'GPT_4o' },
  { name: 'GPT 4 TURBO', value: 'GPT_4_TURBO' },
  { name: 'GPT 4', value: 'GPT_4' },
]

/**
 * Mapping of Claude model identifiers to their API names.
 * @type {Record<ClaudeModelType, string>}
 */
export const CLAUDE_MODELS: Record<ClaudeModelType, string> = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

export const CLAUDE_CHOICES = [
  { name: 'Claude 3.5 Sonnet', value: 'CLAUDE_3_5_SONNET' },
  { name: 'Claude 3 Opus', value: 'CLAUDE_3_OPUS' },
  { name: 'Claude 3 Sonnet', value: 'CLAUDE_3_SONNET' },
  { name: 'Claude 3 Haiku', value: 'CLAUDE_3_HAIKU' },
]

/**
 * Mapping of Cohere model identifiers to their API names.
 * @type {Record<CohereModelType, string>}
 */
export const COHERE_MODELS: Record<CohereModelType, string> = {
  COMMAND_R: "command-r", // Standard Command model
  COMMAND_R_PLUS: "command-r-plus" // Enhanced Command model
}

export const COHERE_CHOICES = [
  { name: 'Command R', value: 'COMMAND_R' },
  { name: 'Command R Plus', value: 'COMMAND_R_PLUS' },
]

/**
 * Mapping of Gemini model identifiers to their API names.
 * @type {Record<GeminiModelType, string>}
 */
export const GEMINI_MODELS: Record<GeminiModelType, string> = {
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  // GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO: "gemini-1.5-pro-exp-0827",
}

export const GEMINI_CHOICES = [
  { name: 'Gemini 1.5 Flash', value: 'GEMINI_1_5_FLASH' },
  { name: 'Gemini 1.5 Pro', value: 'GEMINI_1_5_PRO' },
]

/**
 * Mapping of Mistral model identifiers to their API names.
 * @type {Record<MistralModelType, string>}
 */
export const MISTRAL_MODELS: Record<MistralModelType, string> = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

export const MISTRAL_CHOICES = [
  { name: 'Mixtral 8x7b', value: 'MIXTRAL_8x7b' },
  { name: 'Mixtral 8x22b', value: 'MIXTRAL_8x22b' },
  { name: 'Mistral Large', value: 'MISTRAL_LARGE' },
  { name: 'Mistral Nemo', value: 'MISTRAL_NEMO' },
]

/**
 * Mapping of Fireworks model identifiers to their API names.
 * @type {Record<FireworksModelType, string>}
 */
export const FIREWORKS_MODELS: Record<FireworksModelType, string> = {
  LLAMA_3_1_405B: "accounts/fireworks/models/llama-v3p1-405b-instruct",
  LLAMA_3_1_70B: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  LLAMA_3_1_8B: "accounts/fireworks/models/llama-v3p1-8b-instruct",
  LLAMA_3_2_3B: "accounts/fireworks/models/llama-v3p2-3b-instruct",
  LLAMA_3_2_1B: "accounts/fireworks/models/llama-v3p2-1b-instruct",
  QWEN_2_5_72B: "accounts/fireworks/models/qwen2p5-72b-instruct",
}

export const FIREWORKS_CHOICES = [
  { name: 'LLAMA 3 1 405B', value: 'LLAMA_3_1_405B' },
  { name: 'LLAMA 3 1 70B', value: 'LLAMA_3_1_70B' },
  { name: 'LLAMA 3 1 8B', value: 'LLAMA_3_1_8B' },
  { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
  { name: 'LLAMA 3 2 1B', value: 'LLAMA_3_2_1B' },
  { name: 'QWEN 2 5 72B', value: 'QWEN_2_5_72B' },
]

/**
 * Mapping of Together model identifiers to their API names.
 * @type {Record<TogetherModelType, string>}
 */
export const TOGETHER_MODELS: Record<TogetherModelType, string> = {
  LLAMA_3_2_3B: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
  LLAMA_3_1_405B: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
  LLAMA_3_1_70B: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  LLAMA_3_1_8B: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  GEMMA_2_27B: "google/gemma-2-27b-it",
  GEMMA_2_9B: "google/gemma-2-9b-it",
  QWEN_2_5_72B: "Qwen/Qwen2.5-72B-Instruct-Turbo",
  QWEN_2_5_7B: "Qwen/Qwen2.5-7B-Instruct-Turbo",
}

export const TOGETHER_CHOICES = [
  { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
  { name: 'LLAMA 3 1 405B', value: 'LLAMA_3_1_405B' },
  { name: 'LLAMA 3 1 70B', value: 'LLAMA_3_1_70B' },
  { name: 'LLAMA 3 1 8B', value: 'LLAMA_3_1_8B' },
  { name: 'Gemma 2 27B', value: 'GEMMA_2_27B' },
  { name: 'Gemma 2 9B', value: 'GEMMA_2_9B' },
  { name: 'QWEN 2 5 72B', value: 'QWEN_2_5_72B' },
  { name: 'QWEN 2 5 7B', value: 'QWEN_2_5_7B' },
]

/**
 * Mapping of Groq model identifiers to their API names.
 * @type {Record<GroqModelType, string>}
 */
export const GROQ_MODELS: Record<GroqModelType, string> = {
  LLAMA_3_1_70B_VERSATILE: 'llama-3.1-70b-versatile',
  LLAMA_3_1_8B_INSTANT: 'llama-3.1-8b-instant',
  LLAMA_3_2_1B_PREVIEW: 'llama-3.2-1b-preview',
  LLAMA_3_2_3B_PREVIEW: 'llama-3.2-3b-preview',
  MIXTRAL_8X7B_32768: 'mixtral-8x7b-32768',
}

export const GROQ_CHOICES = [
  { name: 'LLAMA 3 1 70B Versatile', value: 'LLAMA_3_1_70B_VERSATILE' },
  { name: 'LLAMA 3 1 8B Instant', value: 'LLAMA_3_1_8B_INSTANT' },
  { name: 'LLAMA 3 2 1B Preview', value: 'LLAMA_3_2_1B_PREVIEW' },
  { name: 'LLAMA 3 2 3B Preview', value: 'LLAMA_3_2_3B_PREVIEW' },
  { name: 'Mixtral 8x7b 32768', value: 'MIXTRAL_8X7B_32768' },
]