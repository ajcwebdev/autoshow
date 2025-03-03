// src/utils/types.ts

/**
 * Represents a single show note record in the database.
 * Matches the Prisma model and underlying database schema.
 */
export type ShowNote = {
  id?: number
  showLink?: string
  channel?: string
  channelURL?: string
  title: string
  description?: string
  publishDate: string
  coverImage?: string
  frontmatter?: string
  prompt?: string
  transcript?: string
  llmOutput?: string
  walletAddress?: string
  mnemonic?: string
}

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
  /** ChatGPT model to use (e.g., 'gpt-4o-mini'). */
  chatgpt?: string
  /** Claude model to use (e.g., 'CLAUDE_3_SONNET'). */
  claude?: string
  /** Fireworks model to use (e.g., ''). */
  fireworks?: string
  /** Together model to use (e.g., ''). */
  together?: string
  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string
  /** Gemini model to use (e.g., 'gemini-1.5-flash'). */
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
 * Represents the configuration for a model, including cost details.
 */
export type ModelConfig = {
  value: string
  label: string
  inputCostPer1M: number
  outputCostPer1M: number
}

/**
 * Represents the complete LLM cost and usage details for logging
 */
export type LogLLMCost = {
  // The name of the model used
  modelName: string
  // The reason why the model request stopped
  stopReason: string
  // Contains token usage details
  tokenUsage: {
    // Number of input tokens used
    input: number | undefined
    // Number of output tokens generated
    output: number | undefined
    // Total number of tokens involved in the request
    total: number | undefined
  }
}