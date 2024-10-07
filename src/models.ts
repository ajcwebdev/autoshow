// src/models.ts

import chalk from 'chalk'
import type { ChalkInstance } from 'chalk'
import type { WhisperModelType, ChatGPTModelType, ClaudeModelType, CohereModelType, GeminiModelType, MistralModelType, OctoModelType, LlamaModelType, OllamaModelType } from './types.js'

export const step: ChalkInstance = chalk.bold.underline
export const dim: ChalkInstance = chalk.dim
export const success: ChalkInstance = chalk.bold.blue
export const opts: ChalkInstance = chalk.magentaBright.bold
export const wait: ChalkInstance = chalk.bold.cyan
export const final: ChalkInstance = chalk.bold.italic

export const log: typeof console.log = console.log

export const ACTION_OPTIONS = ['video', 'playlist', 'urls', 'file', 'rss']
export const LLM_OPTIONS = ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini']
export const TRANSCRIPT_OPTIONS = ['whisper', 'whisperDocker', 'deepgram', 'assembly']

/**
 * Define available Whisper models
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
}

/**
 * Map of ChatGPT model identifiers to their API names
 * @type {Record<ChatGPTModelType, string>}
 */
export const GPT_MODELS: Record<ChatGPTModelType, string> = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

/**
 * Map of Claude model identifiers to their API names
 * @type {Record<ClaudeModelType, string>}
 */
export const CLAUDE_MODELS: Record<ClaudeModelType, string> = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

/**
 * Map of Cohere model identifiers to their API names
 * @type {Record<CohereModelType, string>}
 */
export const COHERE_MODELS: Record<CohereModelType, string> = {
  COMMAND_R: "command-r", // Standard Command model
  COMMAND_R_PLUS: "command-r-plus" // Enhanced Command model
}

/**
 * Map of Gemini model identifiers to their API names
 * @type {Record<GeminiModelType, string>}
 */
export const GEMINI_MODELS: Record<GeminiModelType, string> = {
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  // GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO: "gemini-1.5-pro-exp-0827",
}

/**
 * Map of Mistral model identifiers to their API names
 * @type {Record<MistralModelType, string>}
 */
export const MISTRAL_MODELS: Record<MistralModelType, string> = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

/**
 * Map of OctoAI model identifiers to their API names
 * @type {Record<OctoModelType, string>}
 */
export const OCTO_MODELS: Record<OctoModelType, string> = {
  LLAMA_3_1_8B: "meta-llama-3.1-8b-instruct",
  LLAMA_3_1_70B: "meta-llama-3.1-70b-instruct",
  LLAMA_3_1_405B: "meta-llama-3.1-405b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  NOUS_HERMES_MIXTRAL_8X_7B: "nous-hermes-2-mixtral-8x7b-dpo",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

/**
 * Map of local model identifiers to their filenames and URLs
 * @type {Record<LlamaModelType, {filename: string, url: string}>}
 */
export const LLAMA_MODELS: Record<LlamaModelType, {filename: string, url: string}> = {
  QWEN_2_5_3B: {
    filename: "qwen2.5-3b-instruct-q6_k.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q6_k.gguf"
  },
  PHI_3_5: {
    filename: "Phi-3.5-mini-instruct-Q6_K.gguf",
    url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q6_K.gguf"
  },
  LLAMA_3_2_1B: {
    filename: "Llama-3.2-1B.i1-Q6_K.gguf",
    url: "https://huggingface.co/mradermacher/Llama-3.2-1B-i1-GGUF/resolve/main/Llama-3.2-1B.i1-Q6_K.gguf"
  },
  GEMMA_2_2B: {
    filename: "gemma-2-2b-it-Q6_K.gguf",
    url: "https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q6_K.gguf"
  }
}

/**
 * Map of model identifiers to their corresponding names in Ollama
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