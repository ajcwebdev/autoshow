// src/types.js

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
 * @property {boolean} [noCleanUp] - Flag to indicate whether to keep temporary files after processing.
 * @property {WhisperModelType} [whisper] - Whisper model type to use for transcription (e.g., 'tiny', 'base').
 * @property {WhisperModelType} [whisperDocker] - Whisper model type to use in Docker for transcription.
 * @property {boolean} [deepgram] - Flag to use Deepgram for transcription.
 * @property {boolean} [assembly] - Flag to use AssemblyAI for transcription.
 * @property {boolean} [speakerLabels] - Flag to use speaker labels in AssemblyAI transcription.
 * @property {string} [chatgpt] - ChatGPT model to use (e.g., 'GPT_4o_MINI').
 * @property {string} [claude] - Claude model to use (e.g., 'CLAUDE_3_SONNET').
 * @property {string} [cohere] - Cohere model to use (e.g., 'COMMAND_R_PLUS').
 * @property {string} [mistral] - Mistral model to use (e.g., 'MISTRAL_LARGE').
 * @property {string} [octo] - OctoAI model to use (e.g., 'LLAMA_3_1_8B').
 * @property {string} [llama] - Llama model to use for local inference (e.g., 'LLAMA_3_1_8B_Q4_MODEL').
 * @property {string} [gemini] - Gemini model to use (e.g., 'GEMINI_1_5_FLASH').
 * @property {string[]} [prompt] - Array of prompt sections to include (e.g., ['titles', 'summary']).
 * @property {LLMOption} [llmOpt] - The selected LLM option.
 * @property {TranscriptOption} [transcriptOpt] - The selected transcription option.
 * @property {string} [llamaModel] - Specific Llama model to use.
 * @property {number} [skip] - Number of items to skip in RSS feed processing.
 * @property {string} [order] - Order in which to process RSS feed items ('newest' or 'oldest').
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
 * @property {LLMOption} [llmOpt] - LLM option selected by the user.
 * @property {string} [llamaModel] - Specific Llama model selected by the user.
 * @property {TranscriptOption} [transcriptOpt] - Transcription option selected by the user.
 * @property {boolean} [useDocker] - Whether to use Docker for Whisper transcription.
 * @property {WhisperModelType} [whisperModel] - Whisper model type selected by the user.
 * @property {boolean} [speakerLabels] - Whether to use speaker labels in transcription.
 * @property {string[]} [prompt] - Prompt sections selected by the user.
 * @property {boolean} [noCleanUp] - Whether to keep temporary files after processing.
 * @property {string} [order] - Order in which to process RSS feed items ('newest' or 'oldest').
 * @property {number} [skip] - Number of items to skip in RSS feed processing.
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
 * @param {LLMOption} [llmOpt] - The selected LLM option.
 * @param {TranscriptOption} [transcriptOpt] - The selected transcription option.
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
 * @property {string} formattedDate - The upload date in 'YYYY-MM-DD' format.
 * @property {string} title - The title of the video.
 * @property {string} thumbnail - The URL to the video's thumbnail image.
 * @property {string} webpage_url - The URL to the video's webpage.
 * @property {string} channel - The name of the channel that uploaded the video.
 * @property {string} uploader_url - The URL to the uploader's channel page.
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
 * @typedef {Object} RSSProcessingOptions
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
 * @typedef {'whisper' | 'whisperDocker' | 'deepgram' | 'assembly'} TranscriptOption
 *
 * - `'whisper'`: Use Whisper.cpp for transcription.
 * - `'whisperDocker'`: Use Whisper.cpp in a Docker container.
 * - `'deepgram'`: Use Deepgram's transcription service.
 * - `'assembly'`: Use AssemblyAI's transcription service.
 */

/**
 * Represents the options for transcription.
 * @typedef {Object} TranscriptionOptions
 * @property {boolean} [speakerLabels] - Whether to use speaker labels.
 * @property {string} [language] - The language code for transcription (e.g., 'en').
 * @property {string} [model] - The model type to use for transcription.
 */

/**
 * Represents the available Whisper model types.
 * @typedef {'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large' | 'large-v1' | 'large-v2'} WhisperModelType
 *
 * - `'tiny'`: Smallest multilingual model.
 * - `'tiny.en'`: Smallest English-only model.
 * - `'base'`: Base multilingual model.
 * - `'base.en'`: Base English-only model.
 * - `'small'`: Small multilingual model.
 * - `'small.en'`: Small English-only model.
 * - `'medium'`: Medium multilingual model.
 * - `'medium.en'`: Medium English-only model.
 * - `'large'`: Largest multilingual model (same as 'large-v2').
 * - `'large-v1'`: Large multilingual model version 1.
 * - `'large-v2'`: Large multilingual model version 2.
 */

/**
 * Represents the object containing the different prompts, their instructions to the LLM, and their expected example output
 * @typedef {Object} PromptSection
 * @property {string} instruction - The instructions for the section.
 * @property {string} example - An example output for the section.
 */

/**
 * Represents the options for Language Models (LLMs) that can be used in the application.
 * @typedef {'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'octo' | 'llama' | 'gemini'} LLMOption
 *
 * - `'chatgpt'`: Use OpenAI's ChatGPT models.
 * - `'claude'`: Use Anthropic's Claude models.
 * - `'cohere'`: Use Cohere's language models.
 * - `'mistral'`: Use Mistral AI's language models.
 * - `'octo'`: Use OctoAI's language models.
 * - `'llama'`: Use Llama models for local inference.
 * - `'gemini'`: Use Google's Gemini models.
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
 * @typedef {Object.<LLMOption, LLMFunction>} LLMFunctions
 *
 * This ensures that only valid `LLMOption` values can be used as keys in the `llmFunctions` object.
 */

/**
 * Define all available LLM models
 * @typedef {'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'} ChatGPTModelType - Define available GPT models
 * @typedef {'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'} ClaudeModelType - Define available Claude models
 * @typedef {'COMMAND_R' | 'COMMAND_R_PLUS'} CohereModelType - Define available Cohere models
 * @typedef {'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'} GeminiModelType - Define available Gemini models
 * @typedef {'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'} MistralModelType - Define available Mistral AI models
 * @typedef {'LLAMA_3_1_8B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_405B' | 'MISTRAL_7B' | 'MIXTRAL_8X_7B' | 'NOUS_HERMES_MIXTRAL_8X_7B' | 'WIZARD_2_8X_22B'} OctoModelType - Define available OctoAI models
 * @typedef {'LLAMA_3_1_8B_Q4_MODEL' | 'LLAMA_3_1_8B_Q6_MODEL' | 'GEMMA_2_2B_Q4_MODEL' | 'GEMMA_2_2B_Q6_MODEL' | 'TINY_LLAMA_1B_Q4_MODEL' | 'TINY_LLAMA_1B_Q6_MODEL'} LlamaModelType - Define local model configurations
 */

/**
 * Represents the function signature for cleaning up temporary files.
 * @callback CleanUpFunction
 * @param {string} id - The base filename (without extension) for the files to be cleaned up.
 * @returns {Promise<void>} - A promise that resolves when cleanup is complete.
 */