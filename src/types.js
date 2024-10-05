// src/types.js

import chalk from 'chalk'

export const step = chalk.bold.underline
export const dim = chalk.dim
export const success = chalk.bold.blue
export const opts = chalk.magentaBright.bold
export const wait = chalk.cyan.dim
export const final = chalk.bold.italic

export const log = console.log

/**
 * @file This file contains all the custom type definitions used across the Autoshow project.
 */

/**
 * Represents the processing options passed through command-line arguments or interactive prompts.
 * @typedef {Object} ProcessingOptions
 * @property {string} [video] - URL of the YouTube video to process.
 * @property {string} [playlist] - URL of the YouTube playlist to process.
 * @property {string} [urls] - File path containing a list of URLs to process.
 * @property {string} [file] - Local audio or video file path to process.
 * @property {string} [rss] - URL of the podcast RSS feed to process.
 * @property {string[]} [item] - Specific items (audio URLs) from the RSS feed to process.
 * @property {boolean} [info] - Flag to generate JSON file with RSS feed information instead of processing items.
 * @property {boolean} [noCleanUp] - Flag to indicate whether to keep temporary files after processing.
 * @property {WhisperModelType} [whisperModel] - The Whisper model to use (e.g., 'tiny', 'base').
 * @property {boolean} [deepgram] - Flag to use Deepgram for transcription.
 * @property {boolean} [assembly] - Flag to use AssemblyAI for transcription.
 * @property {boolean} [speakerLabels] - Flag to use speaker labels in AssemblyAI transcription.
 * @property {string} [chatgpt] - ChatGPT model to use (e.g., 'GPT_4o_MINI').
 * @property {string} [claude] - Claude model to use (e.g., 'CLAUDE_3_SONNET').
 * @property {string} [cohere] - Cohere model to use (e.g., 'COMMAND_R_PLUS').
 * @property {string} [mistral] - Mistral model to use (e.g., 'MISTRAL_LARGE').
 * @property {string} [octo] - OctoAI model to use (e.g., 'LLAMA_3_1_8B').
 * @property {string} [llama] - Llama model to use for local inference (e.g., 'LLAMA_3_1_8B_Q4').
 * @property {string} [gemini] - Gemini model to use (e.g., 'GEMINI_1_5_FLASH').
 * @property {string[]} [prompt] - Array of prompt sections to include (e.g., ['titles', 'summary']).
 * @property {LLMServices} [llmServices] - The selected LLM option.
 * @property {TranscriptServices} [transcriptServices] - The selected transcription option.
 * @property {string} [llamaModel] - Specific Llama model to use.
 * @property {number} [skip] - Number of items to skip in RSS feed processing.
 * @property {string} [order] - Order in which to process RSS feed items ('newest' or 'oldest').
 * @property {boolean} [interactive] - Whether to run in interactive mode.
 */

/**
 * Represents the answers received from inquirer prompts in interactive mode.
 * @typedef {Object} InquirerAnswers
 * @property {string} action - The action selected by the user (e.g., 'video', 'playlist').
 * @property {string} [video] - YouTube video URL provided by the user.
 * @property {string} [playlist] - YouTube playlist URL provided by the user.
 * @property {string} [urls] - File path containing URLs provided by the user.
 * @property {string} [file] - Local audio/video file path provided by the user.
 * @property {string} [rss] - RSS feed URL provided by the user.
 * @property {boolean} [specifyItem] - Whether the user wants to specify specific RSS items.
 * @property {string} [item] - Comma-separated audio URLs of specific RSS items.
 * @property {LLMServices} [llmServices] - LLM option selected by the user.
 * @property {string} [llamaModel] - Specific Llama model selected by the user.
 * @property {TranscriptServices} [transcriptServices] - Transcription option selected by the user.
 * @property {boolean} [useDocker] - Whether to use Docker for Whisper transcription.
 * @property {WhisperModelType} [whisperModel] - Whisper model type selected by the user.
 * @property {boolean} [speakerLabels] - Whether to use speaker labels in transcription.
 * @property {string[]} [prompt] - Prompt sections selected by the user.
 * @property {boolean} [noCleanUp] - Whether to keep temporary files after processing.
 * @property {string} [order] - Order in which to process RSS feed items ('newest' or 'oldest').
 * @property {number} [skip] - Number of items to skip in RSS feed processing.
 * @property {boolean} [confirmAction] - Whether to proceed with the action.
 */

/**
 * Represents the structure of the inquirer prompt questions.
 * @typedef {Object[]} InquirerQuestions
 * @property {string} type - The type of the prompt (e.g., 'input', 'list', 'confirm', 'checkbox').
 * @property {string} name - The name of the answer property.
 * @property {string} message - The message to display to the user.
 * @property {Array|Function} [choices] - The choices available for selection (for 'list' and 'checkbox' types).
 * @property {Function} [when] - A function to determine when to display the prompt.
 * @property {Function} [validate] - A function to validate the user's input.
 * @property {*} [default] - The default value for the prompt.
 */

/**
 * Represents a handler function for processing different actions (e.g., video, playlist).
 * @callback HandlerFunction
 * @param {string} input - The primary input (e.g., URL or file path) for processing.
 * @param {LLMServices} [llmServices] - The selected LLM option.
 * @param {TranscriptServices} [transcriptServices] - The selected transcription option.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<void>} - A promise that resolves when processing is complete.
 */

/**
 * Represents the data structure for markdown generation.
 * @typedef {Object} MarkdownData
 * @property {string} frontMatter - The front matter content for the markdown file.
 * @property {string} finalPath - The base file path (without extension) for the markdown file.
 * @property {string} filename - The sanitized filename used for the markdown file.
 */

/**
 * Represents the metadata extracted from a YouTube video.
 * @typedef {Object} VideoMetadata
 * @property {string} showLink - The URL to the video's webpage.
 * @property {string} channel - The name of the channel that uploaded the video.
 * @property {string} channelURL - The URL to the uploader's channel page.
 * @property {string} title - The title of the video.
 * @property {string} description - The description of the video (empty string in this case).
 * @property {string} publishDate - The upload date in 'YYYY-MM-DD' format.
 * @property {string} coverImage - The URL to the video's thumbnail image.
 */

/**
 * Represents an item in an RSS feed.
 * @typedef {Object} RSSItem
 * @property {string} publishDate - The publication date of the RSS item (e.g., '2024-09-24').
 * @property {string} title - The title of the RSS item.
 * @property {string} coverImage - The URL to the cover image of the RSS item.
 * @property {string} showLink - The URL to the show or episode.
 * @property {string} channel - The name of the channel or podcast.
 * @property {string} channelURL - The URL to the channel or podcast.
 * @property {string} [description] - A brief description of the RSS item.
 * @property {string} [audioURL] - The URL to the audio file of the RSS item.
 */

/**
 * Represents the options for RSS feed processing.
 * @typedef {Object} RSSOptions
 * @property {string} [order] - The order to process items ('newest' or 'oldest').
 * @property {number} [skip] - The number of items to skip.
 */

/**
 * Represents the options for downloading audio files.
 * @typedef {Object} DownloadAudioOptions
 * @property {string} [outputFormat] - The desired output audio format (e.g., 'wav').
 * @property {number} [sampleRate] - The sample rate for the audio file (e.g., 16000).
 * @property {number} [channels] - The number of audio channels (e.g., 1 for mono).
 */

/**
 * Represents the supported file types for audio and video processing.
 * @typedef {'wav' | 'mp3' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'} SupportedFileType
 */

/**
 * Represents the transcription services that can be used in the application.
 * @typedef {'whisper' | 'whisperDocker' | 'deepgram' | 'assembly'} TranscriptServices
 *
 * - whisper: Use Whisper.cpp for transcription.
 * - whisperDocker: Use Whisper.cpp in a Docker container.
 * - deepgram: Use Deepgram's transcription service.
 * - assembly: Use AssemblyAI's transcription service.
 */

/**
 * Represents the available Whisper model types.
 * @typedef {'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large-v2'} WhisperModelType
 *
 * - tiny: Smallest multilingual model.
 * - tiny.en: Smallest English-only model.
 * - base: Base multilingual model.
 * - base.en: Base English-only model.
 * - small: Small multilingual model.
 * - small.en: Small English-only model.
 * - medium: Medium multilingual model.
 * - medium.en: Medium English-only model.
 * - large-v1: Large multilingual model version 1.
 * - large-v2: Large multilingual model version 2.
 */

/**
 * Define available Whisper models
 * @type {Record<WhisperModelType, string>}
 */
export const WHISPER_MODELS = {
    'tiny': 'ggml-tiny.bin',
    'tiny.en': 'ggml-tiny.en.bin',
    'base': 'ggml-base.bin',
    'base.en': 'ggml-base.en.bin',
    'small': 'ggml-small.bin',
    'small.en': 'ggml-small.en.bin',
    'medium': 'ggml-medium.bin',
    'medium.en': 'ggml-medium.en.bin',
    'large-v1': 'ggml-large-v1.bin',
    'large-v2': 'ggml-large-v2.bin',
  }

/**
 * Represents the object containing the different prompts, their instructions to the LLM, and their expected example output.
 * @typedef {Object} PromptSection
 * @property {string} instruction - The instructions for the section.
 * @property {string} example - An example output for the section.
 */

/**
 * Represents the options for Language Models (LLMs) that can be used in the application.
 * @typedef {'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'octo' | 'llama' | 'ollama' | 'gemini'} LLMServices
 *
 * - chatgpt: Use OpenAI's ChatGPT models.
 * - claude: Use Anthropic's Claude models.
 * - cohere: Use Cohere's language models.
 * - mistral: Use Mistral AI's language models.
 * - octo: Use OctoAI's language models.
 * - llama: Use Llama models for local inference.
 * - ollama: Use Ollama for processing.
 * - gemini: Use Google's Gemini models.
 */

/**
 * Represents the options for LLM processing.
 * @typedef {Object} LLMOptions
 * @property {string[]} [promptSections] - The sections to include in the prompt (e.g., ['titles', 'summary']).
 * @property {string} [model] - The specific LLM model to use.
 * @property {number} [temperature] - The temperature parameter for text generation.
 * @property {number} [maxTokens] - The maximum number of tokens to generate.
 */

/**
 * Represents a function that calls an LLM for processing.
 * @callback LLMFunction
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {string} [model] - The specific model to use for the LLM (optional).
 * @returns {Promise<void>} - A promise that resolves when the LLM processing is complete.
 */

/**
 * Represents a mapping of LLM option keys to their corresponding functions.
 * @typedef {Object.<LLMServices, LLMFunction>} LLMFunctions
 *
 * This ensures that only valid `LLMServices` values can be used as keys in the `llmFunctions` object.
 */

/**
 * Define all available LLM models.
 * @typedef {'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'} ChatGPTModelType - Define available GPT models.
 * @typedef {'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'} ClaudeModelType - Define available Claude models.
 * @typedef {'COMMAND_R' | 'COMMAND_R_PLUS'} CohereModelType - Define available Cohere models.
 * @typedef {'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'} GeminiModelType - Define available Gemini models.
 * @typedef {'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'} MistralModelType - Define available Mistral AI models.
 * @typedef {'LLAMA_3_1_8B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_405B' | 'MISTRAL_7B' | 'MIXTRAL_8X_7B' | 'NOUS_HERMES_MIXTRAL_8X_7B' | 'WIZARD_2_8X_22B'} OctoModelType - Define available OctoAI models.
 * @typedef {'QWEN_2_5_3B' | 'PHI_3_5' | 'LLAMA_3_2_1B' | 'GEMMA_2_2B'} LlamaModelType - Define local model configurations.
 * @typedef {'LLAMA_3_2_1B' | 'LLAMA_3_2_3B' | 'GEMMA_2_2B' | 'PHI_3_5' | 'QWEN_2_5_1B' | 'QWEN_2_5_3B'} OllamaModelType - Define local model with Ollama.
 */

/**
 * Map of ChatGPT model identifiers to their API names
 * @type {Record<ChatGPTModelType, string>}
 */
export const GPT_MODELS = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

/**
 * Map of Claude model identifiers to their API names
 * @type {Record<ClaudeModelType, string>}
 */
export const CLAUDE_MODELS = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

/**
 * Map of Cohere model identifiers to their API names
 * @type {Record<CohereModelType, string>}
 */
export const COHERE_MODELS = {
  COMMAND_R: "command-r", // Standard Command model
  COMMAND_R_PLUS: "command-r-plus" // Enhanced Command model
}

/**
 * Map of Gemini model identifiers to their API names
 * @type {Record<GeminiModelType, string>}
 */
export const GEMINI_MODELS = {
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  // GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO: "gemini-1.5-pro-exp-0827",
}

/**
 * Map of Mistral model identifiers to their API names
 * @type {Record<MistralModelType, string>}
 */
export const MISTRAL_MODELS = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

/**
 * Map of OctoAI model identifiers to their API names
 * @type {Record<OctoModelType, string>}
 */
export const OCTO_MODELS = {
  LLAMA_3_1_8B: "meta-llama-3.1-8b-instruct",
  LLAMA_3_1_70B: "meta-llama-3.1-70b-instruct",
  LLAMA_3_1_405B: "meta-llama-3.1-405b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  NOUS_HERMES_MIXTRAL_8X_7B: "nous-hermes-2-mixtral-8x7b-dpo",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

/**
 * Map of local model identifiers to their filenames and URLs
 * @type {Record<LlamaModelType, {filename: string, url: string}>}
 */
export const LLAMA_MODELS = {
  QWEN_2_5_3B: {
    filename: "qwen2.5-3b-instruct-q6_k.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q6_k.gguf"
  },
  PHI_3_5: {
    filename: "Phi-3.5-mini-instruct-Q6_K.gguf",
    url: "https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q6_K.gguf"
  },
  LLAMA_3_2_1B: {
    filename: "Llama-3.2-1B.i1-Q6_K.gguf",
    url: "https://huggingface.co/mradermacher/Llama-3.2-1B-i1-GGUF/resolve/main/Llama-3.2-1B.i1-Q6_K.gguf"
  },
  GEMMA_2_2B: {
    filename: "gemma-2-2b-it-Q6_K.gguf",
    url: "https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q6_K.gguf"
  }
}

/**
 * Map of model identifiers to their corresponding names in Ollama
 * @type {Record<OllamaModelType, string>}
 */
export const OLLAMA_MODELS = {
  LLAMA_3_2_1B: 'llama3.2:1b',
  LLAMA_3_2_3B: 'llama3.2:3b',
  GEMMA_2_2B: 'gemma2:2b',
  PHI_3_5: 'phi3.5:3.8b',
  QWEN_2_5_1B: 'qwen2.5:1.5b',
  QWEN_2_5_3B: 'qwen2.5:3b',
}

/**
 * Represents the function signature for cleaning up temporary files.
 * @callback CleanUpFunction
 * @param {string} id - The base filename (without extension) for the files to be cleaned up.
 * @returns {Promise<void>} - A promise that resolves when cleanup is complete.
 */