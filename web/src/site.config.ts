// web/src/site.config.ts

import type { SiteConfig } from "@/types"
import type { AstroExpressiveCodeOptions } from "astro-expressive-code"

export const PROCESS_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'file', label: 'File' },
] as const

export const PROMPT_CHOICES = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'FAQ', value: 'faq' },
  { name: 'Blog', value: 'blog' },
  { name: 'Rap Song', value: 'rapSong' },
  { name: 'Rock Song', value: 'rockSong' },
  { name: 'Country Song', value: 'countrySong' },
]

export const TRANSCRIPTION_SERVICES = [
  { value: 'whisper', label: 'Whisper.cpp' },
  { value: 'deepgram', label: 'Deepgram' },
  { value: 'assembly', label: 'AssemblyAI' },
]

export const WHISPER_MODELS = [
  { value: 'tiny', label: 'tiny' },
  { value: 'tiny.en', label: 'tiny.en' },
  { value: 'base', label: 'base' },
  { value: 'base.en', label: 'base.en' },
  { value: 'small', label: 'small' },
  { value: 'small.en', label: 'small.en' },
  { value: 'medium', label: 'medium' },
  { value: 'medium.en', label: 'medium.en' },
  { value: 'large-v1', label: 'large-v1' },
  { value: 'large-v2', label: 'large-v2' },
  { value: 'large-v3-turbo', label: 'large-v3-turbo' },
  { value: 'turbo', label: 'turbo' },
]

export const LLM_SERVICES = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'deepseek', label: 'Deepseek' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'together', label: 'Together AI' },
  { value: 'groq', label: 'Groq' },
]

export const LLM_MODELS = {
  ollama: [
    { value: 'qwen2.5:0.5b', label: 'QWEN 2 5 0B' },
    { value: 'qwen2.5:1.5b', label: 'QWEN 2.5 1.5B' },
    { value: 'qwen2.5:3b', label: 'QWEN 2.5 3B' },
    { value: 'llama3.2:1b', label: 'LLAMA 3.2 1B' },
    { value: 'llama3.2:3b', label: 'LLAMA 3.2 3B' },
    { value: 'gemma2:2b', label: 'GEMMA 2 2B' },
    { value: 'phi3.5:3.8b', label: 'PHI 3.5' },
  ],
  chatgpt: [
    { value: 'gpt-4o-mini', label: 'GPT 4o Mini' },
    { value: 'gpt-4o', label: 'GPT 4o' },
    { value: 'o1-mini', label: 'GPT o1 MINI' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  cohere: [
    { value: 'command-r', label: 'Command R' },
    { value: 'command-r-plus', label: 'Command R Plus' },
  ],
  mistral: [
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7b' },
    { value: 'open-mixtral-8x22b', label: 'Mixtral 8x22b' },
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'open-mistral-nemo', label: 'Mistral Nemo' },
  ],
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro-exp-0827', label: 'Gemini 1.5 Pro' },
  ],
  fireworks: [
    { value: 'accounts/fireworks/models/llama-v3p1-405b-instruct', label: 'LLAMA 3.1 405B' },
    { value: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'LLAMA 3.1 70B' },
    { value: 'accounts/fireworks/models/llama-v3p1-8b-instruct', label: 'LLAMA 3.1 8B' },
    { value: 'accounts/fireworks/models/llama-v3p2-3b-instruct', label: 'LLAMA 3.2 3B' },
    { value: 'accounts/fireworks/models/llama-v3p2-1b-instruct', label: 'LLAMA 3.2 1B' },
    { value: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'QWEN 2.5 72B' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', label: 'LLAMA 3.2 3B' },
    { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'LLAMA 3.1 405B' },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'LLAMA 3.1 70B' },
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'LLAMA 3.1 8B' },
    { value: 'google/gemma-2-27b-it', label: 'Gemma 2 27B' },
    { value: 'google/gemma-2-9b-it', label: 'Gemma 2 9B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'QWEN 2.5 72B' },
    { value: 'Qwen/Qwen2.5-7B-Instruct-Turbo', label: 'QWEN 2.5 7B' },
  ],
  groq: [
    { value: 'llama-3.1-70b-versatile', label: 'LLAMA 3.1 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'LLAMA 3.1 8B Instant' },
    { value: 'llama-3.2-1b-preview', label: 'LLAMA 3.2 1B Preview' },
    { value: 'llama-3.2-3b-preview', label: 'LLAMA 3.2 3B Preview' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7b 32768' },
  ],
}

export const siteConfig: SiteConfig = {
	author: "Anthony Campolo",
	title: "Astro Autoshow",
	description: "Autoshow site generator with Astro.",
	lang: "en-US",
	ogLocale: "en_US",
	sortPostsByUpdatedDate: false,
	date: {
		locale: "en-US",
		options: {
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	},
}

export const menuLinks: { path: string, title: string }[] = [
	{
		title: "Home",
		path: "/",
	},
	{
		title: "Show Notes",
		path: "/show-notes/",
	},
	{
		title: "App",
		path: "/app/",
	},
]

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
	themes: ["dracula", "github-light"],
	themeCssSelector(theme, { styleVariants }) {
		// If one dark and one light theme are available
		// generate theme CSS selectors compatible with cactus-theme dark mode switch
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`
		}
		// return default selector
		return `[data-theme="${theme.name}"]`
	},
	useThemedScrollbars: false,
	styleOverrides: {
		frames: {
			frameBoxShadowCssValue: "none",
		},
		uiLineHeight: "inherit",
		codeFontSize: "0.875rem",
		codeLineHeight: "1.7142857rem",
		borderRadius: "4px",
		codePaddingInline: "1rem",
		codeFontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;',
	},
}
