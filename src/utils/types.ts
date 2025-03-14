// src/utils/types.ts

/**
 * Represents a single show note record in the database.
 * Matches the Prisma model and underlying database schema.
 *
 * Added fields to store LLM and transcription details, including service, model, costs, and final cost.
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
  llmService?: string
  llmModel?: string
  llmCost?: number
  transcriptionService?: string
  transcriptionModel?: string
  transcriptionCost?: number
  finalCost?: number
}

export type ShowNoteMetadata = {
  showLink?: string
  channel?: string
  channelURL?: string
  title: string
  description?: string
  publishDate: string
  coverImage?: string
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
  whisper?: boolean | string
  /** Flag to use Deepgram for transcription or Deepgram model to use. */
  deepgram?: boolean | string
  /** Flag to use AssemblyAI for transcription or AssemblyAI model to use. */
  assembly?: boolean | string
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

export type WhisperOutput = {
  systeminfo: string
  model: {
    type: string
    multilingual: boolean
    vocab: number
    audio: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    text: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    mels: number
    ftype: number
  }
  params: {
    model: string
    language: string
    translate: boolean
  }
  result: {
    language: string
  }
  transcription: Array<{
    timestamps: {
      from: string
      to: string
    }
    offsets: {
      from: number
      to: number
    }
    text: string
  }>
}

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
  timestamp: number
  isLive: boolean
}

/**
 * Represents the result returned by any transcription call.
 */
export interface TranscriptionResult {
  transcript: string
  modelId: string
  costPerMinuteCents: number
}

/**
 * Represents usage details returned by an LLM call.
 */
export type LLMUsage = {
  stopReason: string
  input?: number
  output?: number
  total?: number
}

/**
 * Represents the result of an LLM call, including the generated content and usage details.
 */
export type LLMResult = {
  content: string
  usage?: LLMUsage
}

/**
 * Type for LLM function signatures, returning both content and usage details.
 */
export type LLMFunction = (prompt: string, transcript: string, options: any) => Promise<LLMResult>