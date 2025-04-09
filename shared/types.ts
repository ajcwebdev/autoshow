// shared/types.ts

import { L_CONFIG } from './constants.ts'

/**
 * Represents a single show note record in the database.
 * Matches the Prisma model and underlying database schema.
 *
 * Added fields to store LLM and transcription details, including service, model, costs, and final cost.
 * Now includes the 'content' field from the frontend type.
 */
export interface ShowNoteType {
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
  content?: string
}

/**
 * Metadata subset of show note fields.
 */
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
 * Processing options passed through command-line arguments or HTTP requests.
 */
export type ProcessingOptions = {
  /** URL of the YouTube video to process. */
  video?: string
  /** Local audio or video file path to process. */
  file?: string
  /** Flag to indicate whether to keep temporary audio WAV file after processing. */
  saveAudio?: boolean
  /** The Whisper model to use (e.g., 'tiny', 'base'). */
  whisper?: boolean | string
  /** Flag to use Groq for transcription or Groq model to use. */
  groq?: boolean | string
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
  /** Provide override for Deepgram API key. */
  deepgramApiKey?: string
  /** Provide override for AssemblyAI API key. */
  assemblyApiKey?: string
  /** Provide override for Groq API key. */
  groqApiKey?: string
  /** Provide override for OpenAI API key. */
  openaiApiKey?: string
  /** Provide override for Anthropic API key. */
  anthropicApiKey?: string
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

/**
 * Whisper transcription output structure.
 */
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

/**
 * Interface for general site configuration in Astro.
 */
export interface SiteConfig {
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	date: {
		locale: string | string[] | undefined
		options: Intl.DateTimeFormatOptions
	}
	sortPostsByUpdatedDate: boolean
}

/**
 * Interface for site-level metadata (Open Graph, SEO, etc.).
 */
export interface SiteMeta {
	title: string
	description?: string
	ogImage?: string | undefined
	articleDate?: string | undefined
}

/**
 * Define types for the Alert component props.
 */
export interface AlertProps {
  message: string
  variant: string
}

/**
 * Define the allowed LLM service keys from L_CONFIG.
 */
export type LlmServiceKey = keyof typeof L_CONFIG

/**
 * Define props for the Form component.
 */
export interface FormProps {
  onNewShowNote: () => void
}

/**
 * Define the result object returned by the server for show note operations.
 */
export interface ResultType {
  transcript: string
  frontMatter: string
  prompt: string
  llmOutput: string
  content?: string
  message?: string
}

/**
 * Enum-like union for different process options on the frontend.
 */
export type ProcessTypeEnum = 'video' | 'file'

export type LLMServiceKey = keyof typeof L_CONFIG