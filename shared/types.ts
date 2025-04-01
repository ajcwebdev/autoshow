// shared/types.ts

import { LLM_SERVICES_CONFIG } from './constants.ts'
export interface ShowNote {
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
export type ProcessingOptions = {
  video?: string
  playlist?: string
  channel?: string
  urls?: string
  file?: string
  rss?: string | string[]
  item?: string[]
  info?: boolean
  saveAudio?: boolean
  whisper?: boolean | string
  deepgram?: boolean | string
  assembly?: boolean | string
  speakerLabels?: boolean
  transcriptCost?: string
  llmCost?: string
  runLLM?: string
  chatgpt?: string
  claude?: string
  fireworks?: string
  together?: string
  gemini?: string
  deepseek?: string
  prompt?: string[]
  printPrompt?: string[]
  customPrompt?: string
  llmServices?: string
  transcriptServices?: string
  skip?: number
  order?: string
  last?: number
  date?: string[]
  lastDays?: number
  openaiApiKey?: string
  anthropicApiKey?: string
  deepgramApiKey?: string
  assemblyApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  togetherApiKey?: string
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
export type HandlerFunction = (
  options: ProcessingOptions,
  input: string,
  llmServices?: string,
  transcriptServices?: string
) => Promise<void>
export interface VideoInfo {
  uploadDate: string
  url: string
  date: Date
  timestamp: number
  isLive: boolean
}
export interface TranscriptionResult {
  transcript: string
  modelId: string
  costPerMinuteCents: number
}
export type LLMUsage = {
  stopReason: string
  input?: number
  output?: number
  total?: number
}
export type LLMResult = {
  content: string
  usage?: LLMUsage
}
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
export interface SiteMeta {
	title: string
	description?: string
	ogImage?: string | undefined
	articleDate?: string | undefined
}
export interface AlertProps {
  message: string
  variant: string
}
export type LlmServiceKey = keyof typeof LLM_SERVICES_CONFIG
export interface FormProps {
  onNewShowNote: () => void
}
export interface ResultType {
  transcript: string
  frontMatter: string
  prompt: string
  llmOutput: string
  content?: string
  message?: string
}
export type ProcessTypeEnum = 'video' | 'file'