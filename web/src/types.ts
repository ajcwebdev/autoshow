// web/src/types.ts

import { LLM_MODELS } from '@/site-config'

export interface SiteConfig {
	author: string;
	title: string;
	description: string;
	lang: string;
	ogLocale: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	sortPostsByUpdatedDate: boolean;
}

export interface PaginationLink {
	url: string;
	text?: string;
	srLabel?: string;
}

export interface SiteMeta {
	title: string;
	description?: string;
	ogImage?: string | undefined;
	articleDate?: string | undefined;
}

// Define types for the Alert component props
export interface AlertProps {
  message: string
  variant: string
}

// Define the allowed LLM service keys from LLM_MODELS
export type LlmServiceKey = keyof typeof LLM_MODELS

// Define props for the Form component
export interface FormProps {
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
  llmOutput?: string
  id?: number
}

// Define type for different process options
export type ProcessTypeEnum = 'video' | 'file'