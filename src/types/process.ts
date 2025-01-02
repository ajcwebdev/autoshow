// src/types/process.ts

import type { TranscriptServices, WhisperModelType } from './transcription'
import type { LLMServices } from './llms'

// Define types for the request body
export interface ProcessRequestBody {
  type: 'video' | 'urls' | 'rss' | 'playlist' | 'file' | 'channel'
  url?: string
  filePath?: string
  [key: string]: any // Allow for additional properties from validateRequest
}

// Define valid action types for processing
export type ValidAction = 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'

/**
 * Processing options passed through command-line arguments.
 */
export type ProcessingOptions = {
  /** URL of the YouTube video to process. */
  video?: string

  /** URL of the YouTube playlist to process. */
  playlist?: string

  /** URL of the YouTube channel to process. */
  channel?: string

  /** File path containing a list of URLs to process. */
  urls?: string

  /** Local audio or video file path to process. */
  file?: string

  /** URL of the podcast RSS feed to process. */
  rss?: string | string[]

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

  /** Fireworks model to use (e.g., ''). */
  fireworks?: string

  /** Together model to use (e.g., ''). */
  together?: string

  /** Groq model to use (e.g., ''). */
  groq?: string

  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string

  /** Gemini model to use (e.g., 'GEMINI_1_5_FLASH'). */
  gemini?: string

  /** Array of prompt sections to include (e.g., ['titles', 'summary']). */
  prompt?: string[]

  /** Print selected prompts to the terminal without running any process commands. */
  printPrompt?: string[]

  /** Use a custom prompt saved in a markdown file */
  customPrompt?: string

  /** The selected LLM option. */
  llmServices?: LLMServices

  /** The selected transcription option. */
  transcriptServices?: TranscriptServices

  /** Number of items to skip in RSS feed processing. */
  skip?: number

  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  order?: string

  /** Number of most recent items to process (overrides --order and --skip). */
  last?: number

  /** Date of RSS items to process. */
  date?: string[]

  /** Number of previous days to check for RSS items to process. */
  lastDays?: number

  /** Provide override for OpenAI API key. */
  openaiApiKey?: string

  /** Provide override for Anthropic API key. */
  anthropicApiKey?: string

  /** Provide override for Deepgram API key. */
  deepgramApiKey?: string

  /** Provide override for AssemblyAI API key. */
  assemblyApiKey?: string

  /** Provide override for Gemini API key. */
  geminiApiKey?: string

  /** Provide override for Cohere API key. */
  cohereApiKey?: string

  /** Provide override for Mistral API key. */
  mistralApiKey?: string

  /** Provide override for GROK API key. */
  grokApiKey?: string

  /** Provide override for Together API key. */
  togetherApiKey?: string

  /** Provide override for Fireworks API key. */
  fireworksApiKey?: string

  /** Provide override for Groq API key. */
  groqApiKey?: string
}

// Handler and Processing Types
/**
 * Handler function for processing different actions (e.g., video, playlist).
 * 
 * @param options - The options containing various inputs
 * @param input - The specific input (URL or file path)
 * @param llmServices - The selected LLM service (optional)
 * @param transcriptServices - The selected transcription service (optional)
 */
export type HandlerFunction = (
  options: ProcessingOptions,
  input: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
) => Promise<void> | Promise<string>

// Content Types
/**
 * Data structure for markdown generation.
 */
export type MarkdownData = {
  /** The front matter content for the markdown file. */
  frontMatter: string

  /** The base file path (without extension) for the markdown file. */
  finalPath: string

  /** The sanitized filename used for the markdown file. */
  filename: string

  /** The metadata used in the frontmatter saved to a JSON object. */
  metadata: {
    showLink: string
    channel: string
    channelURL: string
    title: string
    description: string
    publishDate: string
    coverImage: string
  }
}

/**
 * Metadata extracted from a YouTube video.
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

  /** The description of the video. */
  description: string

  /** The upload date in 'YYYY-MM-DD' format. */
  publishDate: string

  /** The URL to the video's thumbnail image. */
  coverImage: string
}

/**
 * Video information including upload date, URL, and type.
 */
export interface VideoInfo {
  uploadDate: string
  url: string
  date: Date
  timestamp: number  // Unix timestamp for more precise sorting
  isLive: boolean   // Flag to identify live streams
}

// RSS Feed Types
/**
 * Item in an RSS feed.
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
 * Options for RSS feed processing.
 */
export type RSSOptions = {
  /** The order to process items ('newest' or 'oldest'). */
  order?: string

  /** The number of items to skip. */
  skip?: number
}

// Audio Processing Types
/**
 * Options for downloading audio files.
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
 * Supported file types for audio and video processing.
 */
export type SupportedFileType = 'wav' | 'mp3' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'

// Prompt Types
/**
 * Object containing different prompts, their instructions to the LLM, and expected example output.
 */
export type PromptSection = {
  /** The instructions for the section. */
  instruction: string

  /** An example output for the section. */
  example: string
}

/**
 * Function signature for cleaning up temporary files.
 * 
 * @param id - The unique identifier for the temporary files
 */
export type CleanUpFunction = (id: string) => Promise<void>