// src/utils/globals.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { WhisperModelType, TranscriptServiceConfig } from '../types/transcription'
import type { LLMServiceConfig, LLMServices } from '../types/llms'
import type { RequestBody } from '../types/process'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

/**
 * Configure XML parser for RSS feed processing.
 * Handles attributes without prefixes and allows boolean values.
 *
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/* ------------------------------------------------------------------
 * Environment Variable Maps
 * ------------------------------------------------------------------ */

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
  groqApiKey: 'GROQ_API_KEY',
}

/**
 * Maps server-side request body keys to corresponding environment variables.
 * 
 */
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
  groqApiKey: 'GROQ_API_KEY',
}

/* ------------------------------------------------------------------
 * Prompt & Action Choices
 * ------------------------------------------------------------------ */

/**
 * Provides user-friendly prompt choices for content generation or summary tasks.
 * 
 */
export const PROMPT_CHOICES: Array<{ name: string; value: string }> = [
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
 * Available action options for content processing with additional metadata.
 * 
 */
export const ACTION_OPTIONS: Array<{
  name: string
  description: string
  message: string
  validate: (input: string) => boolean | string
}> = [
  {
    name: 'video',
    description: 'Single YouTube Video',
    message: 'Enter the YouTube video URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'playlist',
    description: 'YouTube Playlist',
    message: 'Enter the YouTube playlist URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'channel',
    description: 'YouTube Channel',
    message: 'Enter the YouTube channel URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'urls',
    description: 'List of URLs from File',
    message: 'Enter the file path containing URLs:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'file',
    description: 'Local Audio/Video File',
    message: 'Enter the local audio/video file path:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'rss',
    description: 'Podcast RSS Feed',
    message: 'Enter the podcast RSS feed URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
]

/**
 * Additional CLI flags or options that can be enabled.
 * 
 */
export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'noCleanUp',
  'order',
  'skip',
  'info',
  'item',
]

/* ------------------------------------------------------------------
 * Transcription Services & Models
 * ------------------------------------------------------------------ */

/**
 * Available transcription services and their configuration.
 * 
 */
export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

/**
 * Array of valid transcription service values.
 * 
 */
export const TRANSCRIPT_OPTIONS: string[] = Object.values(TRANSCRIPT_SERVICES).map(
  (service) => service.value
)

/**
 * Whisper-only transcription services (subset of TRANSCRIPT_SERVICES).
 * 
 */
export const WHISPER_SERVICES: string[] = Object.values(TRANSCRIPT_SERVICES)
  .filter(
    (
      service
    ): service is TranscriptServiceConfig & {
      isWhisper: true
    } => service.isWhisper === true
  )
  .map((service) => service.value)

/**
 * Mapping of Whisper model types to their corresponding binary filenames for whisper.cpp.
 * @type {Record<WhisperModelType, string>}
 */
export const WHISPER_MODELS: Record<WhisperModelType, string> = {
  tiny: 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',
  base: 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',
  small: 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  medium: 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin',
  'large-v2': 'ggml-large-v2.bin',
  'large-v3-turbo': 'ggml-large-v3-turbo.bin',
  turbo: 'ggml-large-v3-turbo.bin',
}

/* ------------------------------------------------------------------
 * LLM Services & Model Configurations
 * ------------------------------------------------------------------ */

/**
 * Mapping of available LLM providers and their configuration.
 * A value of `null` indicates an option to skip LLM processing.
 * 
 */
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

/**
 * Array of valid LLM service values (excluding the "SKIP" option).
 * 
 */
export const LLM_OPTIONS: LLMServices[] = Object.values(LLM_SERVICES)
  .map((service) => service.value)
  .filter((value): value is LLMServices => value !== null)