// src/types/main.ts

import type { TranscriptServices, WhisperModelType } from './transcript-service-types'

/**
 * Processing options passed through command-line arguments or interactive prompts.
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
  rss?: string[]

  /** Specific items (audio URLs) from the RSS feed to process. */
  item?: string[]

  /** Flag to generate JSON file with RSS feed information instead of processing items. */
  info?: boolean

  /** Flag to indicate whether to keep temporary files after processing. */
  noCleanUp?: boolean

  /** The Whisper model to use (e.g., 'tiny', 'base'). */
  whisper?: WhisperModelType

  /** The Whisper Python model to use (e.g., 'tiny', 'base'). */
  whisperPython?: WhisperModelType

  /** The Whisper Diarization model to use (e.g., 'tiny', 'base'). */
  whisperDiarization?: WhisperModelType

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

  /** Whether to run in interactive mode. */
  interactive?: boolean
}

// Interactive CLI Types
/**
 * Answers received from inquirer prompts in interactive mode.
 */
export type InquirerAnswers = {
  /** The action selected by the user (e.g., 'video', 'playlist'). */
  action?: string

  /** YouTube video URL provided by the user. */
  video?: string

  /** YouTube playlist URL provided by the user. */
  playlist?: string

  /** YouTube channel URL provided by the user. */
  channel?: string

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

  /** Whether to generate JSON file with RSS feed information instead of processing items. */
  info?: boolean

  /** Number of items to skip in RSS feed processing. */
  skip?: number

  /** Number of most recent items to process (overrides order and skip). */
  last?: number

  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  order?: string

  /** LLM option selected by the user. */
  llmServices?: LLMServices

  /** Specific LLM model selected by the user. */
  llmModel?: string

  /** Transcription option selected by the user. */
  transcriptServices?: TranscriptServices

  /** Whisper model type selected by the user. */
  whisperModel?: WhisperModelType

  /** Whether to use speaker labels in transcription. */
  speakerLabels?: boolean

  /** Prompt sections selected by the user. */
  prompt?: string[]

  /** Whether to keep temporary files after processing. */
  noCleanUp?: boolean

  /** Whether to proceed with the action. */
  confirmAction?: boolean
}

/**
 * Structure of the inquirer prompt questions.
 */
export type InquirerQuestions = Array<{
  /** The type of the prompt (e.g., 'input', 'list', 'confirm', 'checkbox'). */
  type: string

  /** The name of the answer property. */
  name: string

  /** The message to display to the user. */
  message: string

  /** The choices available for selection (for 'list' and 'checkbox' types). */
  choices?: Array<any> | (() => Array<any>)

  /** A function to determine when to display the prompt. */
  when?: () => boolean

  /** A function to validate the user's input. */
  validate?: (input: any) => boolean | string

  /** The default value for the prompt. */
  default?: any
}>

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

// LLM Types
/**
 * Options for Language Models (LLMs) that can be used in the application.
 */
export type LLMServices = 'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'ollama' | 'gemini' | 'fireworks' | 'together' | 'groq'

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