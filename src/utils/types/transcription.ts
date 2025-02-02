// src/types/transcription.ts

/**
 * Transcription services that can be used in the application.
 */
export type TranscriptServices = 'whisper' | 'deepgram' | 'assembly'

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

export type DeepgramModelType = 'NOVA_2' | 'NOVA' | 'ENHANCED' | 'BASE'

export type AssemblyModelType = 'BEST' | 'NANO'

export type WhisperOutput = {
  systeminfo: string
  model: {
    type: string
    multilingual: boolean
    vocab: number
    audio: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    text: {
      ctx: number
      state: number
      head: number
      layer: number
    }
    mels: number
    ftype: number
  }
  params: {
    model: string
    language: string
    translate: boolean
  }
  result: {
    language: string
  }
  transcription: Array<{
    timestamps: {
      from: string
      to: string
    }
    offsets: {
      from: number
      to: number
    }
    text: string
  }>
}