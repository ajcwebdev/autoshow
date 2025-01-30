// src/types/transcription.ts

/**
 * Transcription services that can be used in the application.
 */
export type TranscriptServices = 'whisper' | 'deepgram' | 'assembly'

export type TranscriptServiceConfig = {
  name: string
  value: TranscriptServices
  isWhisper?: boolean
}

/**
 * Describes parameters needed for logging transcription cost details.
 */
export type TranscriptionCostInfo = {
  /**
   * The name of the model being used
   */
  modelName: string

  /**
   * The cost (in USD) per minute for the model
   */
  costPerMinute: number

  /**
   * The file path to the audio file
   */
  filePath: string
}

export type WhisperModelType = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large-v2' | 'large-v3-turbo' | 'turbo'
export type DeepgramModelType = 'NOVA_2' | 'NOVA' | 'ENHANCED' | 'BASE'
export type AssemblyModelType = 'BEST' | 'NANO'