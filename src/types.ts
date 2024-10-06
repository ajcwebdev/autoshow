// src/types.ts

import type { ChalkInstance } from 'chalk'
// import type { BuiltInQuestion } from 'inquirer'
// import BuiltInQuestion from 'inquirer'
import chalk from 'chalk'

export const step: ChalkInstance = chalk.bold.underline
export const dim: ChalkInstance = chalk.dim
export const success: ChalkInstance = chalk.bold.blue
export const opts: ChalkInstance = chalk.magentaBright.bold
export const wait: ChalkInstance = chalk.cyan.dim
export const final: ChalkInstance = chalk.bold.italic

export const log: typeof console.log = console.log

/**
 * @file This file contains all the custom type definitions used across the Autoshow project.
 */

/**
 * Represents the processing options passed through command-line arguments or interactive prompts.
 */
export type ProcessingOptions = {
  /** URL of the YouTube video to process. */
  video?: string
  /** URL of the YouTube playlist to process. */
  playlist?: string
  /** File path containing a list of URLs to process. */
  urls?: string
  /** Local audio or video file path to process. */
  file?: string
  /** URL of the podcast RSS feed to process. */
  rss?: string
  /** Specific items (audio URLs) from the RSS feed to process. */
  item?: string[]
  /** Flag to generate JSON file with RSS feed information instead of processing items. */
  info?: boolean
  /** Flag to indicate whether to keep temporary files after processing. */
  noCleanUp?: boolean
  /** The Whisper model to use (e.g., 'tiny', 'base'). */
  whisper?: WhisperModelType
  /** The Whisper model to use with Docker (e.g., 'tiny', 'base'). */
  whisperDocker?: WhisperModelType
  /** Flag to use Deepgram for transcription. */
  deepgram?: boolean
  /** Flag to use AssemblyAI for transcription. */
  assembly?: boolean
  /** Flag to use speaker labels in AssemblyAI transcription. */
  speakerLabels?: boolean
  /** ChatGPT model to use (e.g., 'GPT_4o_MINI'). */
  chatgpt?: string
  /** Claude model to use (e.g., 'CLAUDE_3_SONNET'). */
  claude?: string
  /** Cohere model to use (e.g., 'COMMAND_R_PLUS'). */
  cohere?: string
  /** Mistral model to use (e.g., 'MISTRAL_LARGE'). */
  mistral?: string
  /** OctoAI model to use (e.g., 'LLAMA_3_1_8B'). */
  octo?: string
  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string
  /** Llama model to use for local inference (e.g., 'LLAMA_3_1_8B'). */
  llama?: string
  /** Gemini model to use (e.g., 'GEMINI_1_5_FLASH'). */
  gemini?: string
  /** Array of prompt sections to include (e.g., ['titles', 'summary']). */
  prompt?: string[]
  /** The selected LLM option. */
  llmServices?: LLMServices | undefined
  /** The selected transcription option. */
  transcriptServices?: TranscriptServices | undefined
  /** Number of items to skip in RSS feed processing. */
  skip?: number
  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  last?: number
  /** Number of most recent items to process (overrides --order and --skip). */
  order?: string
  /** Whether to run in interactive mode. */
  interactive?: boolean
}

/**
 * Represents the answers received from inquirer prompts in interactive mode.
 */
export type InquirerAnswers = {
  /** The action selected by the user (e.g., 'video', 'playlist'). */
  action?: string  // Make this optional
  /** YouTube video URL provided by the user. */
  video?: string
  /** YouTube playlist URL provided by the user. */
  playlist?: string
  /** File path containing URLs provided by the user. */
  urls?: string
  /** Local audio/video file path provided by the user. */
  file?: string
  /** RSS feed URL provided by the user. */
  rss?: string
  /** Whether the user wants to specify specific RSS items. */
  specifyItem?: boolean
  /** Comma-separated audio URLs of specific RSS items. */
  item?: string | string[]
  /** LLM option selected by the user. */
  llmServices?: LLMServices | undefined
  /** Specific Llama model selected by the user. */
  llamaModel?: string
  /** Transcription option selected by the user. */
  transcriptServices?: TranscriptServices | undefined
  /** Whisper model type selected by the user. */
  whisperModel?: WhisperModelType  // Add whisperModel to the InquirerAnswers
  /** Whether to use speaker labels in transcription. */
  speakerLabels?: boolean
  /** Prompt sections selected by the user. */
  prompt?: string[]
  /** Whether to keep temporary files after processing. */
  noCleanUp?: boolean
  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  order?: string
  /** Number of items to skip in RSS feed processing. */
  skip?: number
  /** Whether to proceed with the action. */
  confirmAction?: boolean
}

/**
 * Represents the structure of the inquirer prompt questions.
 */
export type InquirerQuestions = Array<{
  /** The type of the prompt (e.g., 'input', 'list', 'confirm', 'checkbox'). */
  type: string
  /** The name of the answer property. */
  name: string
  /** The message to display to the user. */
  message: string
  /** The choices available for selection (for 'list' and 'checkbox' types). */
  choices?: Array<any> | Function
  /** A function to determine when to display the prompt. */
  when?: Function
  /** A function to validate the user's input. */
  validate?: Function
  /** The default value for the prompt. */
  default?: any
}>

/**
 * Represents a handler function for processing different actions (e.g., video, playlist).
 */
export type HandlerFunction = (
  // The options containing various inputs
  options: ProcessingOptions,
  // The specific input (URL or file path)
  input: string,
  // Allow llmServices to be optional or undefined
  llmServices?: LLMServices | undefined,
  // Allow transcriptServices to be optional or undefined
  transcriptServices?: TranscriptServices | undefined
) => Promise<void>

/**
 * Represents the data structure for markdown generation.
 */
export type MarkdownData = {
  /** The front matter content for the markdown file. */
  frontMatter: string
  /** The base file path (without extension) for the markdown file. */
  finalPath: string
  /** The sanitized filename used for the markdown file. */
  filename: string
}

/**
 * Represents the metadata extracted from a YouTube video.
 */
export type VideoMetadata = {
  /** The URL to the video's webpage. */
  showLink: string
  /** The name of the channel that uploaded the video. */
  channel: string
  /** The URL to the uploader's channel page. */
  channelURL: string
  /** The title of the video. */
  title: string
  /** The description of the video (empty string in this case). */
  description: string
  /** The upload date in 'YYYY-MM-DD' format. */
  publishDate: string
  /** The URL to the video's thumbnail image. */
  coverImage: string
}

/**
 * Represents an item in an RSS feed.
 */
export type RSSItem = {
  /** The publication date of the RSS item (e.g., '2024-09-24'). */
  publishDate: string
  /** The title of the RSS item. */
  title: string
  /** The URL to the cover image of the RSS item. */
  coverImage: string
  /** The URL to the show or episode. */
  showLink: string
  /** The name of the channel or podcast. */
  channel: string
  /** The URL to the channel or podcast. */
  channelURL: string
  /** A brief description of the RSS item. */
  description?: string
  /** The URL to the audio file of the RSS item. */
  audioURL?: string
}

/**
 * Represents the options for RSS feed processing.
 */
export type RSSOptions = {
  /** The order to process items ('newest' or 'oldest'). */
  order?: string
  /** The number of items to skip. */
  skip?: number
}

/**
 * Represents the options for downloading audio files.
 */
export type DownloadAudioOptions = {
  /** The desired output audio format (e.g., 'wav'). */
  outputFormat?: string
  /** The sample rate for the audio file (e.g., 16000). */
  sampleRate?: number
  /** The number of audio channels (e.g., 1 for mono). */
  channels?: number
}

/**
 * Represents the supported file types for audio and video processing.
 */
export type SupportedFileType = 'wav' | 'mp3' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'

/**
 * Represents the transcription services that can be used in the application.
 *
 * - whisper: Use Whisper.cpp for transcription.
 * - whisperDocker: Use Whisper.cpp in a Docker container.
 * - deepgram: Use Deepgram's transcription service.
 * - assembly: Use AssemblyAI's transcription service.
 */
export type TranscriptServices = 'whisper' | 'whisperDocker' | 'deepgram' | 'assembly'

/**
 * Represents the available Whisper model types.
 *
 * - tiny: Smallest multilingual model.
 * - tiny.en: Smallest English-only model.
 * - base: Base multilingual model.
 * - base.en: Base English-only model.
 * - small: Small multilingual model.
 * - small.en: Small English-only model.
 * - medium: Medium multilingual model.
 * - medium.en: Medium English-only model.
 * - large-v1: Large multilingual model version 1.
 * - large-v2: Large multilingual model version 2.
 */
export type WhisperModelType = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large-v2'

/**
 * Represents the object containing the different prompts, their instructions to the LLM, and their expected example output.
 */
export type PromptSection = {
  /** The instructions for the section. */
  instruction: string
  /** An example output for the section. */
  example: string
}

/**
 * Represents the options for Language Models (LLMs) that can be used in the application.
 *
 * - chatgpt: Use OpenAI's ChatGPT models.
 * - claude: Use Anthropic's Claude models.
 * - cohere: Use Cohere's language models.
 * - mistral: Use Mistral AI's language models.
 * - octo: Use OctoAI's language models.
 * - llama: Use Llama models for local inference.
 * - ollama: Use Ollama for processing.
 * - gemini: Use Google's Gemini models.
 */
export type LLMServices = 'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'octo' | 'llama' | 'ollama' | 'gemini'

/**
 * Represents the options for LLM processing.
 */
export type LLMOptions = {
  /** The sections to include in the prompt (e.g., ['titles', 'summary']). */
  promptSections?: string[]
  /** The specific LLM model to use. */
  model?: string
  /** The temperature parameter for text generation. */
  temperature?: number
  /** The maximum number of tokens to generate. */
  maxTokens?: number
}

/**
 * Represents a function that calls an LLM for processing.
 */
export type LLMFunction = (
  promptAndTranscript: string,
  tempPath: string,
  llmModel?: string
) => Promise<void>

/**
 * Represents a mapping of LLM option keys to their corresponding functions.
 *
 * This ensures that only valid `LLMServices` values can be used as keys in the `llmFunctions` object.
 */
export type LLMFunctions = {
  [K in LLMServices]: LLMFunction
}

/**
 * Define all available LLM models.
 */
/** Define available GPT models. */
export type ChatGPTModelType = 'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'
/** Define available Claude models. */
export type ClaudeModelType = 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'
/** Define available Cohere models. */
export type CohereModelType = 'COMMAND_R' | 'COMMAND_R_PLUS'
/** Define available Gemini models. */
export type GeminiModelType = 'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'
/** Define available Mistral AI models. */
export type MistralModelType = 'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'
/** Define available OctoAI models. */
export type OctoModelType = 'LLAMA_3_1_8B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_405B' | 'MISTRAL_7B' | 'MIXTRAL_8X_7B' | 'NOUS_HERMES_MIXTRAL_8X_7B' | 'WIZARD_2_8X_22B'
/** Define local model configurations. */
export type LlamaModelType = 'QWEN_2_5_3B' | 'PHI_3_5' | 'LLAMA_3_2_1B' | 'GEMMA_2_2B'
/** Define local model with Ollama. */
export type OllamaModelType = 'LLAMA_3_2_1B' | 'LLAMA_3_2_3B' | 'GEMMA_2_2B' | 'PHI_3_5' | 'QWEN_2_5_1B' | 'QWEN_2_5_3B'

/**
 * Represents the function signature for cleaning up temporary files.
 */
export type CleanUpFunction = (id: string) => Promise<void>