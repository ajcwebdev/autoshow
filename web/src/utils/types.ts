// web/src/utils/types.ts

import { LLM_MODELS } from '@/site-config'

// Define types for the Alert component props
export interface AlertProps {
  message: string
  variant: string
}

// Define the allowed LLM service keys from LLM_MODELS
export type LlmServiceKey = keyof typeof LLM_MODELS

// Define props for the Inputs component
export interface InputsProps {
  onNewShowNote: () => void
}

// Define type for the result object returned by the server
export interface ResultType {
  transcript: string
  frontMatter: string
  prompt: string
  llmOutput: string
  content?: string
  message?: string
}

// Define types for show notes
export interface ShowNoteType {
  title: string
  publishDate: string
  content: string
  transcript: string
  frontmatter: string
  prompt: string
  id?: number
}

// Define type for different process options
export type ProcessType = 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'