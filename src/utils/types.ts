// src/types/process.ts

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
  /** Flag to indicate whether to keep temporary audio WAV file after processing. */
  saveAudio?: boolean
  /** The Whisper model to use (e.g., 'tiny', 'base'). */
  whisper?: boolean
  /** Flag to use Deepgram for transcription. */
  deepgram?: boolean
  /** Flag to use AssemblyAI for transcription. */
  assembly?: boolean
  /** Flag to use speaker labels in AssemblyAI transcription. */
  speakerLabels?: boolean
  /** File path for estimating transcription cost. */
  transcriptCost?: string
  /** File path for estimating LLM cost. */
  llmCost?: string
  /** Flag to run LLM on the processed transcript. */
  runLLM?: string
  /** ChatGPT model to use (e.g., 'GPT_4o_MINI'). */
  chatgpt?: string
  /** Claude model to use (e.g., 'CLAUDE_3_SONNET'). */
  claude?: string
  /** Fireworks model to use (e.g., ''). */
  fireworks?: string
  /** Together model to use (e.g., ''). */
  together?: string
  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string
  /** Gemini model to use (e.g., 'GEMINI_1_5_FLASH'). */
  gemini?: string
  /** DeepSeek model to use (e.g., ''). */
  deepseek?: string
  /** Array of prompt sections to include (e.g., ['titles', 'summary']). */
  prompt?: string[]
  /** Print selected prompts to the terminal without running any process commands. */
  printPrompt?: string[]
  /** Use a custom prompt saved in a markdown file */
  customPrompt?: string
  /** The selected LLM option. */
  llmServices?: string
  /** The selected transcription option. */
  transcriptServices?: string
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
  /** Provide override for Deepseek API key. */
  deepseekApiKey?: string
  /** Provide override for Together API key. */
  togetherApiKey?: string
  /** Provide override for Fireworks API key. */
  fireworksApiKey?: string
  [key: string]: any
}

// Parse the JSON output
export interface PlaylistEntry {
  id: string;
}

export interface PlaylistData {
  title: string;
  entries: PlaylistEntry[];
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
 * @interface EpisodeMetadata
 * @property {string} [showLink]
 * @property {string} [channel]
 * @property {string} [channelURL]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [publishDate]
 * @property {string} [coverImage]
 */
export interface EpisodeMetadata {
  showLink?: string | undefined
  channel?: string | undefined
  channelURL?: string | undefined
  title?: string | undefined
  description?: string | undefined
  publishDate?: string | undefined
  coverImage?: string | undefined
}

// Define valid action types for processing
export type ValidCLIAction = 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'

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
  llmServices?: string,
  transcriptServices?: string
) => Promise<void>

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

/**
 * Item in an RSS feed.
 */
export type RSSItem = {
  enclosure?: {
    url?: string
    type?: string
  }
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