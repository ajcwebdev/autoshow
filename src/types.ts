// src/types.ts

/**
 * @file Custom type definitions used across the Autoshow project.
 * @packageDocumentation
 */

// Core Processing Types
/**
 * Processing options passed through command-line arguments or interactive prompts.
 */
export type ProcessingOptions = {
  /** URL of the YouTube video to process. */
  video?: string

  /** URL of the YouTube playlist to process. */
  playlist?: string

  /** URL of the YouTube channel to process. */
  channel?: string

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

  /** Fireworks model to use (e.g., ''). */
  fireworks?: string

  /** Together model to use (e.g., ''). */
  together?: string

  /** Groq model to use (e.g., ''). */
  groq?: string

  /** Ollama model to use for local inference (e.g., 'LLAMA_3_2_1B'). */
  ollama?: string

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

// Interactive CLI Types
/**
 * Answers received from inquirer prompts in interactive mode.
 */
export type InquirerAnswers = {
  /** The action selected by the user (e.g., 'video', 'playlist'). */
  action?: string

  /** YouTube video URL provided by the user. */
  video?: string

  /** YouTube playlist URL provided by the user. */
  playlist?: string

  /** YouTube channel URL provided by the user. */
  channel?: string

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
 * Structure of the inquirer prompt questions.
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

// Handler and Processing Types
/**
 * Handler function for processing different actions (e.g., video, playlist).
 * 
 * @param options - The options containing various inputs
 * @param input - The specific input (URL or file path)
 * @param llmServices - The selected LLM service (optional)
 * @param transcriptServices - The selected transcription service (optional)
 */
export type HandlerFunction = (
  options: ProcessingOptions,
  input: string,
  llmServices?: LLMServices,
  transcriptServices?: TranscriptServices
) => Promise<void> | Promise<string>

// Content Types
/**
 * Data structure for markdown generation.
 */
export type MarkdownData = {
  /** The front matter content for the markdown file. */
  frontMatter: string

  /** The base file path (without extension) for the markdown file. */
  finalPath: string

  /** The sanitized filename used for the markdown file. */
  filename: string

  /** The metadata used in the frontmatter saved to a JSON object. */
  metadata: {
    showLink: string
    channel: string
    channelURL: string
    title: string
    description: string
    publishDate: string
    coverImage: string
  }
}

/**
 * Metadata extracted from a YouTube video.
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

  /** The description of the video. */
  description: string

  /** The upload date in 'YYYY-MM-DD' format. */
  publishDate: string

  /** The URL to the video's thumbnail image. */
  coverImage: string
}

// RSS Feed Types
/**
 * Item in an RSS feed.
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
 * Options for RSS feed processing.
 */
export type RSSOptions = {
  /** The order to process items ('newest' or 'oldest'). */
  order?: string

  /** The number of items to skip. */
  skip?: number
}

// Audio Processing Types
/**
 * Options for downloading audio files.
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
 * Supported file types for audio and video processing.
 */
export type SupportedFileType = 'wav' | 'mp3' | 'm4a' | 'aac' | 'ogg' | 'flac' | 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'

// Transcription Service Types
/**
 * Transcription services that can be used in the application.
 */
export type TranscriptServices = 'whisper' | 'whisperDocker' | 'whisperPython' | 'whisperDiarization' | 'deepgram' | 'assembly'

/**
 * Available Whisper model types with varying sizes and capabilities.
 */
export type WhisperModelType = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large-v2' | 'large-v3-turbo' | 'turbo'

/**
 * Whisper-specific transcription services.
 */
export type WhisperTranscriptServices = 'whisper' | 'whisperDocker' | 'whisperPython' | 'whisperDiarization'

// LLM Types
/**
 * Object containing different prompts, their instructions to the LLM, and expected example output.
 */
export type PromptSection = {
  /** The instructions for the section. */
  instruction: string

  /** An example output for the section. */
  example: string
}

/**
 * Options for Language Models (LLMs) that can be used in the application.
 */
export type LLMServices = 'chatgpt' | 'claude' | 'cohere' | 'mistral' | 'ollama' | 'gemini' | 'fireworks' | 'together' | 'groq'

/**
 * Options for LLM processing.
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
 * Function that calls an LLM for processing.
 * 
 * @param promptAndTranscript - The combined prompt and transcript
 * @param tempPath - The temporary file path
 * @param llmModel - The specific LLM model to use (optional)
 */
export type LLMFunction = (
  promptAndTranscript: string,
  tempPath: string,
  llmModel?: string
) => Promise<void>

/**
 * Mapping of LLM option keys to their corresponding functions.
 */
export type LLMFunctions = {
  [K in LLMServices]: LLMFunction
}

// LLM Model Types
/**
 * Available GPT models.
 */
export type ChatGPTModelType = 'GPT_4o_MINI' | 'GPT_4o' | 'GPT_4_TURBO' | 'GPT_4'

/**
 * Available Claude models.
 */
export type ClaudeModelType = 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_OPUS' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_HAIKU'

/**
 * Available Cohere models.
 */
export type CohereModelType = 'COMMAND_R' | 'COMMAND_R_PLUS'

/**
 * Available Gemini models.
 */
export type GeminiModelType = 'GEMINI_1_5_FLASH' | 'GEMINI_1_5_PRO'

/**
 * Available Mistral AI models.
 */
export type MistralModelType = 'MIXTRAL_8x7b' | 'MIXTRAL_8x22b' | 'MISTRAL_LARGE' | 'MISTRAL_NEMO'

/**
 * Available Fireworks models.
 */
export type FireworksModelType = 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'LLAMA_3_2_3B' | 'LLAMA_3_2_1B' | 'QWEN_2_5_72B'

/**
 * Available Together models.
 */
export type TogetherModelType = 'LLAMA_3_2_3B' | 'LLAMA_3_1_405B' | 'LLAMA_3_1_70B' | 'LLAMA_3_1_8B' | 'GEMMA_2_27B' | 'GEMMA_2_9B' | 'QWEN_2_5_72B' | 'QWEN_2_5_7B'

/**
 * Available Groq models.
 */
export type GroqModelType = 'LLAMA_3_1_70B_VERSATILE' | 'LLAMA_3_1_8B_INSTANT' | 'LLAMA_3_2_1B_PREVIEW' | 'LLAMA_3_2_3B_PREVIEW' | 'MIXTRAL_8X7B_32768'

/**
 * Local model with Ollama.
 */
export type OllamaModelType = 'LLAMA_3_2_1B' | 'LLAMA_3_2_3B' | 'GEMMA_2_2B' | 'PHI_3_5' | 'QWEN_2_5_1B' | 'QWEN_2_5_3B'

// API Response Types
/**
 * Response structure from Fireworks AI API.
 */
export type FireworksResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** Input prompts */
  prompt: any[]

  /** Array of completion choices */
  choices: {

    /** Reason for completion finish */
    finish_reason: string

    /** Index of the choice */
    index: number

    /** Message content and metadata */
    message: {

      /** Role of the message author */
      role: string

      /** Generated content */
      content: string

      /** Tool calls made during generation */
      tool_calls: {

        /** Tool call identifier */
        id: string

        /** Type of tool call */
        type: string

        /** Function call details */
        function: {

          /** Name of the function called */
          name: string

          /** Arguments passed to the function */
          arguments: string
        }
      }[]
    }
  }[]
  /** Token usage statistics */
  usage: {

    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number
  }
}

/**
 * Response structure from Together AI API.
 */
export type TogetherResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** Input prompts */
  prompt: any[]

  /** Array of completion choices */
  choices: {

    /** Generated text */
    text: string

    /** Reason for completion finish */
    finish_reason: string

    /** Random seed used */
    seed: number

    /** Choice index */
    index: number

    /** Message content and metadata */
    message: {

      /** Role of the message author */
      role: string

      /** Generated content */
      content: string

      /** Tool calls made during generation */
      tool_calls: {

        /** Index of the tool call */
        index: number

        /** Tool call identifier */
        id: string

        /** Type of tool call */
        type: string

        /** Function call details */
        function: {

          /** Name of the function called */
          name: string

          /** Arguments passed to the function */
          arguments: string
        }
      }[]
    }
    /** Log probability information */
    logprobs: {

      /** Array of token IDs */
      token_ids: number[]

      /** Array of tokens */
      tokens: string[]

      /** Log probabilities for tokens */
      token_logprobs: number[]
    }
  }[]
  /** Token usage statistics */
  usage: {

    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number
  }
}

/**
 * Response structure from Groq Chat Completion API.
 */
export type GroqChatCompletionResponse = {
  /** Unique identifier for the response */
  id: string

  /** Type of object */
  object: string

  /** Timestamp of creation */
  created: number

  /** Model used for generation */
  model: string

  /** System fingerprint */
  system_fingerprint: string | null

  /** Array of completion choices */
  choices: {

    /** Choice index */
    index: number

    /** Message content and metadata */
    message: {

      /** Role of the message author */
      role: 'assistant' | 'user' | 'system'

      /** Generated content */
      content: string
    }

    /** Reason for completion finish */
    finish_reason: string

    /** Optional log probability information */
    logprobs?: {

      /** Array of tokens */
      tokens: string[]

      /** Log probabilities for tokens */
      token_logprobs: number[]

      /** Top log probabilities */
      top_logprobs: Record<string, number>[]

      /** Text offsets for tokens */
      text_offset: number[]
    } | null
  }[]
  /** Optional usage statistics */
  usage?: {
    /** Number of tokens in the prompt */
    prompt_tokens: number

    /** Number of tokens in the completion */
    completion_tokens: number

    /** Total tokens used */
    total_tokens: number

    /** Optional timing for prompt processing */
    prompt_time?: number

    /** Optional timing for completion generation */
    completion_time?: number

    /** Optional total processing time */
    total_time?: number
  }
}

/**
 * Response structure from Ollama API.
 */
export type OllamaResponse = {
  /** Model used for generation */
  model: string

  /** Timestamp of creation */
  created_at: string

  /** Message content and metadata */
  message: {

    /** Role of the message author */
    role: string

    /** Generated content */
    content: string
  }
  /** Reason for completion */
  done_reason: string

  /** Whether generation is complete */
  done: boolean

  /** Total processing duration */
  total_duration: number

  /** Model loading duration */
  load_duration: number

  /** Number of prompt evaluations */
  prompt_eval_count: number

  /** Duration of prompt evaluation */
  prompt_eval_duration: number

  /** Number of evaluations */
  eval_count: number

  /** Duration of evaluation */
  eval_duration: number
}

/**
 * Response structure for Ollama model tags.
 */
export type OllamaTagsResponse = {
  /** Array of available models */
  models: Array<{

    /** Model name */
    name: string

    /** Base model identifier */
    model: string

    /** Last modification timestamp */
    modified_at: string

    /** Model size in bytes */
    size: number

    /** Model digest */
    digest: string

    /** Model details */
    details: {

      /** Parent model identifier */
      parent_model: string

      /** Model format */
      format: string

      /** Model family */
      family: string

      /** Array of model families */
      families: string[]

      /** Model parameter size */
      parameter_size: string

      /** Quantization level */
      quantization_level: string
    }
  }>
}

/**
 * Response structure from Deepgram API.
 */
export type DeepgramResponse = {
  /** Metadata about the transcription */
  metadata: {

    /** Transaction key */
    transaction_key: string

    /** Request identifier */
    request_id: string

    /** SHA256 hash */
    sha256: string

    /** Creation timestamp */
    created: string

    /** Audio duration */
    duration: number

    /** Number of audio channels */
    channels: number

    /** Array of models used */
    models: string[]

    /** Information about models used */
    model_info: {
      [key: string]: {

        /** Model name */
        name: string

        /** Model version */
        version: string

        /** Model architecture */
        arch: string
      }
    }
  }
  /** Transcription results */
  results: {

    /** Array of channel results */
    channels: Array<{

      /** Array of alternative transcriptions */
      alternatives: Array<{

        /** Transcribed text */
        transcript: string

        /** Confidence score */
        confidence: number

        /** Array of word-level details */
        words: Array<{

          /** Individual word */
          word: string

          /** Start time */
          start: number

          /** End time */
          end: number

          /** Word-level confidence */
          confidence: number
        }>
      }>
    }>
  }
}

// Assembly Request Types
export interface AssemblyAITranscriptionOptions {
  audio_url: string
  language_code?: string
  speech_model?: 'default' | 'nano'
  boost_param?: number
  filter_profanity?: boolean
  redact_pii?: boolean
  redact_pii_audio?: boolean
  redact_pii_audio_quality?: 'mp3' | 'wav'
  redact_pii_policies?: Array<
    | 'credit_card_number'
    | 'bank_routing'
    | 'credit_card_cvv'
    | 'credit_card_expiration'
    | 'date_of_birth'
    | 'drivers_license'
    | 'email_address'
    | 'events'
    | 'filename'
    | 'gender_sexuality'
    | 'healthcare_number'
    | 'injury'
    | 'ip_address'
    | 'account_number'
    | 'banking_information'
    | 'blood_type'
    | 'date'
    | 'date_interval'
    | 'drug'
    | 'duration'
  >
  redact_pii_sub?: 'entity_name' | 'hash'
  speaker_labels?: boolean
  speakers_expected?: number
  content_safety?: boolean
  content_safety_labels?: boolean
  iab_categories?: boolean
  language_detection?: boolean
  punctuate?: boolean
  format_text?: boolean
  dual_channel?: boolean
  speaker_boost?: boolean
  speech_threshold?: number
  throttled?: boolean
  auto_chapters?: boolean
  summarization?: boolean
  summary_model?: string
  summary_type?: string
  custom_topics?: boolean
  topics?: string[]
  sentiment_analysis?: boolean
  entity_detection?: boolean
  auto_highlights?: boolean
}

// Response Types
export interface AssemblyAIUploadResponse {
  upload_url: string
}

export interface AssemblyAITimestamp {
  start: number
  end: number
}

export interface AssemblyAIWord extends AssemblyAITimestamp {
  text: string
  confidence: number
  speaker?: string
}

export interface AssemblyAIUtterance extends AssemblyAITimestamp {
  text: string
  speaker: string
  confidence: number
}

export interface AssemblyAIKeyPhrase extends AssemblyAITimestamp {
  text: string
  count: number
  rank: number
}

export interface AssemblyAIAutoHighlights {
  status: 'success' | 'unavailable'
  results: AssemblyAIKeyPhrase[]
}

export interface AssemblyAIContentSafetyLabel extends AssemblyAITimestamp {
  text: string
  labels: Array<{
    text: string
    confidence: number
    severity: number
    sentiment: {
      text: string
      confidence: number
    }
  }>
  timestamp: AssemblyAITimestamp
  confidence: number
  speaker?: string
}

export interface AssemblyAIContentSafety {
  status: 'success' | 'unavailable'
  results: AssemblyAIContentSafetyLabel[]
  summary: {
    status: 'success' | 'unavailable'
    result: {
      text: string
      confidence: number
    }
  }
}

export interface AssemblyAISentimentAnalysisResult extends AssemblyAITimestamp {
  text: string
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  confidence: number
  speaker?: string
}

export interface AssemblyAIEntity extends AssemblyAITimestamp {
  text: string
  entity_type: string
  speaker?: string
}

export interface AssemblyAIChapter extends AssemblyAITimestamp {
  gist: string
  headline: string
  summary: string
}

export interface AssemblyAITranscript {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  acoustic_model: string
  audio_duration: number
  audio_url: string
  audio_start_from?: number
  audio_end_at?: number
  text: string
  confidence: number
  language_code: string
  utterances?: AssemblyAIUtterance[]
  words?: AssemblyAIWord[]
  paragraphs?: Array<{
    text: string
    start: number
    end: number
  }>
  error?: string
  
  // Optional enhanced results based on enabled features
  auto_highlights?: AssemblyAIAutoHighlights
  content_safety?: AssemblyAIContentSafety
  sentiment_analysis_results?: AssemblyAISentimentAnalysisResult[]
  entities?: AssemblyAIEntity[]
  chapters?: AssemblyAIChapter[]
}

// Error Response Type
export interface AssemblyAIErrorResponse {
  error: string
  status?: number
  message?: string
}

// Status polling response type
export type AssemblyAIPollingResponse = Pick<AssemblyAITranscript, 'id' | 'status' | 'text' | 'error' | 'words' | 'utterances'>

/**
 * Function signature for cleaning up temporary files.
 * 
 * @param id - The unique identifier for the temporary files
 */
export type CleanUpFunction = (id: string) => Promise<void>