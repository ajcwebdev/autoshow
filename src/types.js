// src/types.js

/**
 * @typedef {'whisper' | 'whisperDocker' | 'deepgram' | 'assembly'} TranscriptOption 
 * @typedef {'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'octo' | 'llama' | 'gemini'} LLMOption
 * @typedef {function(string, string, any): Promise<void>} LLMFunction
 * @typedef {Object.<LLMOption, LLMFunction>} LLMFunctions
 * 
 * @typedef {function(string, LLMOption, TranscriptOption, ProcessingOptions): Promise<void>} HandlerFunction
 */

/**
 * @typedef {Object} ProcessingOptions
 * @property {string[]} [prompt] - Specify prompt sections to include.
 * @property {string} [video] - URL of the YouTube video to process.
 * @property {string} [playlist] - URL of the YouTube playlist to process.
 * @property {string} [urls] - File path containing URLs to process.
 * @property {string} [file] - File path of the local audio/video file to process.
 * @property {string} [rss] - URL of the podcast RSS feed to process.
 * @property {string[]} [item] - Specific items in the RSS feed to process.
 * @property {string} [order='newest'] - Order for RSS feed processing ('newest' or 'oldest').
 * @property {number} [skip=0] - Number of items to skip when processing RSS feed.
 * @property {string} [whisper] - Whisper model type for non-Docker version.
 * @property {string} [whisperDocker] - Whisper model type for Docker version.
 * @property {string} [chatgpt] - ChatGPT model to use for processing.
 * @property {string} [claude] - Claude model to use for processing.
 * @property {string} [cohere] - Cohere model to use for processing.
 * @property {string} [mistral] - Mistral model to use for processing.
 * @property {string} [octo] - Octo model to use for processing.
 * @property {string} [llama] - Llama model to use for processing.
 * @property {string} [gemini] - Gemini model to use for processing.
 * @property {boolean} [deepgram=false] - Use Deepgram for transcription.
 * @property {boolean} [assembly=false] - Use AssemblyAI for transcription.
 * @property {boolean} [speakerLabels=false] - Use speaker labels for AssemblyAI transcription.
 * @property {boolean} [noCleanUp=false] - Do not delete intermediary files after processing.
 * @property {Object<string, any>} [additionalProps] - Additional dynamic properties.
 */

/**
 * @typedef {Object} InquirerAnswers
 * @property {string} [action]
 * @property {string} [video]
 * @property {string} [playlist]
 * @property {string} [urls]
 * @property {string} [file]
 * @property {string} [rss]
 * @property {boolean} [specifyItem]
 * @property {string} [item]
 * @property {LLMOption} [llmOpt]
 * @property {string} [llamaModel]
 * @property {TranscriptOption} [transcriptOpt]
 * @property {boolean} [useDocker]
 * @property {string} [whisperModel]
 * @property {boolean} [speakerLabels]
 * @property {string[]} [prompt]
 * @property {boolean} [noCleanUp]
 */

/**
 * @typedef {Object} MarkdownData
 * @property {string} frontMatter - The front matter content for the markdown file.
 * @property {string} finalPath - The base path for the files.
 * @property {string} filename - The sanitized filename.
 */

/**
 * @typedef {Object} RSSItem
 * @property {string} publishDate - The publish date of the item.
 * @property {string} title - The title of the item.
 * @property {string} coverImage - The cover image URL of the item.
 * @property {string} showLink - The show link of the item.
 * @property {string} channel - The channel name.
 * @property {string} channelURL - The channel URL.
 */