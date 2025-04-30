// shared/types.ts

import { L_CONFIG } from './constants.ts'
export interface LocalResult {
  showNote: ShowNoteType
  llmOutput: string
}
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
  file?: string
  groq?: boolean | string
  deepgram?: boolean | string
  assembly?: boolean | string
  speakerLabels?: boolean
  transcriptCost?: string
  llmCost?: string
  runLLM?: string
  chatgpt?: string
  claude?: string
  gemini?: string
  prompt?: string[]
  printPrompt?: string[]
  customPrompt?: string
  llmServices?: string
  transcriptServices?: string
  deepgramApiKey?: string
  assemblyApiKey?: string
  groqApiKey?: string
  openaiApiKey?: string
  anthropicApiKey?: string
  geminiApiKey?: string
  [key: string]: any
}
export type ChatGPTModelValue = (typeof L_CONFIG.chatgpt.models)[number]['modelId']
export type ClaudeModelValue = (typeof L_CONFIG.claude.models)[number]['modelId']
export type GeminiModelValue = (typeof L_CONFIG.gemini.models)[number]['modelId']
export type GroqModelValue = (typeof L_CONFIG.groq.models)[number]['modelId']
export interface DeepgramWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: number
  speaker_confidence?: number
}
export type TranscriptionCosts = {
  [svc: string]: {
    modelId: string
    cost: number
  }[]
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
	ogImage?: string
	articleDate?: string
}
export interface AlertProps {
  message: string
  variant: string
}
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
export type LLMServiceKey = keyof typeof L_CONFIG
export type GenerateMarkdownBody = {
  type?: string
  url?: string
  filePath?: string
}
export type DownloadAudioBody = {
  input?: string
  filename?: string
  options?: ProcessingOptions
}
export type RunTranscriptionBody = {
  finalPath?: string
  transcriptServices?: string
  options?: ProcessingOptions
}
export type SelectPromptBody = {
  options?: ProcessingOptions
}
export type RunLLMBody = {
  filePath?: string
  llmServices?: string
  options?: ProcessingOptions
}
export interface SaveMarkdownRequest {
  frontMatter: string
  prompt?: string
  transcript: string
  finalPath: string
}