// src/types/transcript-service-types.ts

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