// src/types.ts

/**
 * @file This file contains all the custom type definitions used across the Autoshow project.
 * @packageDocumentation
 */

/**
 * Represents the processing options passed through command-line arguments or interactive prompts.
 */
export type ProcessingOptions = {
  /** URL of the YouTube video to process. */
  video?: string
  /** URL of the YouTube playlist to process. */
  playlist?: string
  /** File path containing a list of URLs to process. */
  urls?: string
  /** Local audio or video file path to process. */
  file?: string
  /** URL of the podcast RSS feed to process. */
  rss?: string
  /** Specific items (audio URLs) from the RSS feed to process. */
  item?: string[]
  /** Flag to generate JSON file with RSS feed information instead of processing items. */
  info?: boolean
  /** Flag to indicate whether to keep temporary files after processing. */
  noCleanUp?: boolean
  /** The Whisper model to use (e.g., 'tiny', 'base'). */
  whisper?: WhisperModelType
  /** The Whisper Python model to use (e.g., 'tiny', 'base'). */
  whisperPython?: WhisperModelType
  /** The Whisper Diarization model to use (e.g., 'tiny', 'base'). */
  whisperDiarization?: WhisperModelType
  /** The Whisper model to use with Docker (e.g., 'tiny', 'base'). */
  whisperDocker?: WhisperModelType
  /** Flag to use Deepgram for transcription. */
  deepgram?: boolean
  /** Flag to use AssemblyAI for transcription. */
  assembly?: boolean
  /** Flag to use speaker labels in AssemblyAI transcription. */
  speakerLabels?: boolean
  /** ChatGPT model to use (e.g., 'GPT_4o_MINI'). */
  chatgpt?: string
  /** Claude model to use (e.g., 'CLAUDE_3_SONNET'). */
  claude?: string
  /** Cohere model to use (e.g., 'COMMAND_R_PLUS'). */
  cohere?: string
  /** Mistral model to use (e.g., 'MISTRAL_LARGE'). */
  mistral?: string
  /** OctoAI model to use (e.g., 'LLAMA_3_1_8B'). */
  octo?: string
  /** Fireworks model to use (e.g., ''). */
  fireworks?: string
  /** Together model to use (e.g., ''). */
  together?: string
  /** Groq model to use (e.g., ''). */
  groq?: string
  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string
  /** Llama model to use for local inference (e.g., 'LLAMA_3_1_8B'). */
  llama?: string
  /** Gemini model to use (e.g., 'GEMINI_1_5_FLASH'). */
  gemini?: string
  /** Array of prompt sections to include (e.g., ['titles', 'summary']). */
  prompt?: string[]
  /** The selected LLM option. */
  llmServices?: LLMServices
  /** The selected transcription option. */
  transcriptServices?: TranscriptServices
  /** Number of items to skip in RSS feed processing. */
  skip?: number
  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  order?: string
  /** Number of most recent items to process (overrides --order and --skip). */
  last?: number
  /** Whether to run in interactive mode. */
  interactive?: boolean
}

/**
 * Represents the answers received from inquirer prompts in interactive mode.
 */
export type InquirerAnswers = {
  /** The action selected by the user (e.g., 'video', 'playlist'). */
  action?: string
  /** YouTube video URL provided by the user. */
  video?: string
  /** YouTube playlist URL provided by the user. */
  playlist?: string
  /** File path containing URLs provided by the user. */
  urls?: string
  /** Local audio/video file path provided by the user. */
  file?: string
  /** RSS feed URL provided by the user. */
  rss?: string
  /** Whether the user wants to specify specific RSS items. */
  specifyItem?: boolean
  /** Comma-separated audio URLs of specific RSS items. */
  item?: string | string[]
  /** Whether to generate JSON file with RSS feed information instead of processing items. */
  info?: boolean
  /** Number of items to skip in RSS feed processing. */
  skip?: number
  /** Number of most recent items to process (overrides order and skip). */
  last?: number
  /** Order in which to process RSS feed items ('newest' or 'oldest'). */
  order?: string
  /** LLM option selected by the user. */
  llmServices?: LLMServices
  /** Specific LLM model selected by the user. */
  llmModel?: string
  /** Transcription option selected by the user. */
  transcriptServices?: TranscriptServices
  /** Whisper model type selected by the user. */
  whisperModel?: WhisperModelType
  /** Whether to use speaker labels in transcription. */
  speakerLabels?: boolean
  /** Prompt sections selected by the user. */
  prompt?: string[]
  /** Whether to keep temporary files after processing. */
  noCleanUp?: boolean
  /** Whether to proceed with the action. */
  confirmAction?: boolean
}

/**
 * Represents the structure of the inquirer prompt questions.
 */
export type InquirerQuestions = Array<{
  /** The type of the prompt (e.g., 'input', 'list', 'confirm', 'checkbox'). */
  type: string
  /** The name of the answer property. */
  name: string
  /** The message to display to the user. */
  message: string
  /** The choices available for selection (for 'list' and 'checkbox' types). */
  choices?: Array<any> | (() => Array<any>)
  /** A function to determine when to display the prompt. */
  when?: () => boolean
  /** A function to validate the user's input. */
  validate?: (input: any) => boolean | string
  /** The default value for the prompt. */
  default?: any
}>

/**
 * Represents a handler function for processing different actions (e.g., video, playlist).
 * @param options - The options containing various inputs.
 * @param input - The specific input (URL or file path).
 * @param llmServices - The selected LLM service (optional).
 * @param transcriptServices - The selected transcription service (optional).
 */
export type HandlerFunction = (
  // The options containing various inputs
  options: ProcessingOptions,
  // The specific input (URL or file path)
  input: string,
  // Allow llmServices to be optional or undefined
  llmServices?: LLMServices,
  // Allow transcriptServices to be optional or undefined
  transcriptServices?: TranscriptServices
) => Promise<void>

/**
 * Represents the data structure for markdown generation.
 */
export type MarkdownData = {
  /** The front matter content for the markdown file. */
  frontMatter: string
  /** The base file path (without extension) for the markdown file. */
  finalPath: string
  /** The sanitized filename used for the markdown file. */
  filename: string
}

/**
 * Represents the metadata extracted from a YouTube video.
 */
export type VideoMetadata = {
  /** The URL to the video's webpage. */
  showLink: string
  /** The name of the channel that uploaded the video. */
  channel: string
  /** The URL to the uploader's channel page. */
  channelURL: string
  /** The title of the video. */
  title: string
  /** The description of the video (empty string in this case). */
  description: string
  /** The upload date in 'YYYY-MM-DD' format. */
  publishDate: string
  /** The URL to the video's thumbnail image. */
  coverImage: string
}

/**
 * Represents an item in an RSS feed.
 */
export type RSSItem = {
  /** The publication date of the RSS item (e.g., '2024-09-24'). */
  publishDate: string
  /** The title of the RSS item. */
  title: string
  /** The URL to the cover image of the RSS item. */
  coverImage: string
  /** The URL to the show or episode. */
  showLink: string
  /** The name of the channel or podcast. */
  channel: string
  /** The URL to the channel or podcast. */
  channelURL: string
  /** A brief description of the RSS item. */
  description?: string
  /** The URL to the audio file of the RSS item. */
  audioURL?: string
}

/**
 * Represents the options for RSS feed processing.
 */
export type RSSOptions = {
  /** The order to process items ('newest' or 'oldest'). */
  order?: string
  /** The number of items to skip. */
  skip?: number
}

/**
 * Represents the options for downloading audio files.
 */
export type DownloadAudioOptions = {
  /** The desired output audio format (e.g., 'wav'). */
  outputFormat?: string
  /** The sample rate for the audio file (e.g., 16000). */
  sampleRate?: number
  /** The number of audio channels (e.g., 1 for mono). */
  channels?: number
}

/**
 * Represents the supported file types for audio and video processing.
 */
export type SupportedFileType = 'wav' | 'mp3' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'

/**
 * Represents the transcription services that can be used in the application.
 *
 * - whisper: Use Whisper.cpp for transcription.
 * - whisperDocker: Use Whisper.cpp in a Docker container.
 * - deepgram: Use Deepgram's transcription service.
 * - assembly: Use AssemblyAI's transcription service.
 */
export type TranscriptServices = 'whisper' | 'whisperDocker' | 'whisperPython' | 'whisperDiarization' | 'deepgram' | 'assembly'

/**
 * Represents the available Whisper model types.
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
 * - large-v3-turbo: Large multilingual model version 3 with new turbo model.
 */
export type WhisperModelType = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large-v2' | 'large-v3-turbo' | 'turbo'

/**
 * Represents the object containing the different prompts, their instructions to the LLM, and their expected example output.
 */
export type PromptSection = {
  /** The instructions for the section. */
  instruction: string
  /** An example output for the section. */
  example: string
}

/**
 * Represents the options for Language Models (LLMs) that can be used in the application.
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
export type LLMServices = 'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'octo' | 'llama' | 'ollama' | 'gemini' | 'fireworks' | 'together' | 'groq'

/**
 * Represents the options for LLM processing.
 */
export type LLMOptions = {
  /** The sections to include in the prompt (e.g., ['titles', 'summary']). */
  promptSections?: string[]
  /** The specific LLM model to use. */
  model?: string
  /** The temperature parameter for text generation. */
  temperature?: number
  /** The maximum number of tokens to generate. */
  maxTokens?: number
}

/**
 * Represents a function that calls an LLM for processing.
 * @param promptAndTranscript - The combined prompt and transcript.
 * @param tempPath - The temporary file path.
 * @param llmModel - The specific LLM model to use (optional).
 */
export type LLMFunction = (
  promptAndTranscript: string,
  tempPath: string,
  llmModel?: string
) => Promise<void>

/**
 * Represents a mapping of LLM option keys to their corresponding functions.
 *
 * This ensures that only valid `LLMServices` values can be used as keys in the `llmFunctions` object.
 */
export type LLMFunctions = {
  [K in LLMServices]: LLMFunction
}

/**
 * Define all available LLM models.
 */
/** Define available GPT models. */
export type ChatGPTModelType = 'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'
/** Define available Claude models. */
export type ClaudeModelType = 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'
/** Define available Cohere models. */
export type CohereModelType = 'COMMAND_R' | 'COMMAND_R_PLUS'
/** Define available Gemini models. */
export type GeminiModelType = 'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'
/** Define available Mistral AI models. */
export type MistralModelType = 'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'
/** Define available OctoAI models. */
export type OctoModelType = 'LLAMA_3_1_8B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_405B' | 'MISTRAL_7B' | 'MIXTRAL_8X_7B' | 'NOUS_HERMES_MIXTRAL_8X_7B' | 'WIZARD_2_8X_22B'
/** Define available Fireworks models. */
export type FireworksModelType = 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'LLAMA_3_2_3B' | 'LLAMA_3_2_1B' | 'QWEN_2_5_72B'
/** Define available Together models. */
export type TogetherModelType = 'LLAMA_3_2_3B' | 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'GEMMA_2_27B' | 'GEMMA_2_9B' | 'QWEN_2_5_72B' | 'QWEN_2_5_7B'
/** Define available Groq models. */
export type GroqModelType = 'LLAMA_3_1_70B_VERSATILE' | 'LLAMA_3_1_8B_INSTANT' | 'LLAMA_3_2_1B_PREVIEW' | 'LLAMA_3_2_3B_PREVIEW' | 'MIXTRAL_8X7B_32768'
/** Define local model configurations. */
export type LlamaModelType = 'QWEN_2_5_1B' | 'QWEN_2_5_3B' | 'PHI_3_5' | 'LLAMA_3_2_1B' | 'GEMMA_2_2B'
/** Define local model with Ollama. */
export type OllamaModelType = 'LLAMA_3_2_1B' | 'LLAMA_3_2_3B' | 'GEMMA_2_2B' | 'PHI_3_5' | 'QWEN_2_5_1B' | 'QWEN_2_5_3B'

export type FireworksResponse = {
  id: string
  object: string
  created: number
  model: string
  prompt: any[]
  choices: {
    finish_reason: string
    index: number
    message: {
      role: string
      content: string
      tool_calls: {
        id: string
        type: string
        function: {
          name: string
          arguments: string
        }
      }[]
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type TogetherResponse = {
  id: string
  object: string
  created: number
  model: string
  prompt: any[]
  choices: {
    text: string
    finish_reason: string
    seed: number
    index: number
    message: {
      role: string
      content: string
      tool_calls: {
        index: number
        id: string
        type: string
        function: {
          name: string
          arguments: string
        }
      }[]
    }
    logprobs: {
      token_ids: number[]
      tokens: string[]
      token_logprobs: number[]
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type GroqChatCompletionResponse = {
  id: string
  object: string
  created: number // UNIX timestamp
  model: string // e.g., "mixtral-8x7b-32768"
  system_fingerprint: string | null // Nullable field
  choices: {
    index: number
    message: {
      role: 'assistant' | 'user' | 'system' // Role of the message author
      content: string // The actual text of the message
    }
    finish_reason: string // Reason why the completion stopped, e.g., "stop"
    logprobs?: {
      tokens: string[] // Tokens generated by the model
      token_logprobs: number[] // Log probabilities for each token
      top_logprobs: Record<string, number>[] // Top logprobs for the tokens
      text_offset: number[] // Text offsets for the tokens
    } | null // Optional logprobs object
  }[]
  usage?: {
    prompt_tokens: number // Tokens used in the prompt
    completion_tokens: number // Tokens used in the generated completion
    total_tokens: number // Total tokens used
    prompt_time?: number // Optional timing for the prompt
    completion_time?: number // Optional timing for the completion
    total_time?: number // Optional total time for both prompt and completion
  }
}

// Define the expected structure of the response from Ollama API
export type OllamaResponse = {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done_reason: string
  done: boolean
  total_duration: number
  load_duration: number
  prompt_eval_count: number
  prompt_eval_duration: number
  eval_count: number
  eval_duration: number
}

export type OllamaTagsResponse = {
  models: Array<{
    name: string
    model: string
    modified_at: string
    size: number
    digest: string
    details: {
      parent_model: string
      format: string
      family: string
      families: string[]
      parameter_size: string
      quantization_level: string
    }
  }>
}

// Define types for Deepgram API response
export type DeepgramResponse = {
  metadata: {
    transaction_key: string
    request_id: string
    sha256: string
    created: string
    duration: number
    channels: number
    models: string[]
    model_info: {
      [key: string]: {
        name: string
        version: string
        arch: string
      }
    }
  }
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string
        confidence: number
        words: Array<{
          word: string
          start: number
          end: number
          confidence: number
        }>
      }>
    }>
  }
}

/**
 * Represents the function signature for cleaning up temporary files.
 * @param id - The unique identifier for the temporary files.
 */
export type CleanUpFunction = (id: string) => Promise<void>