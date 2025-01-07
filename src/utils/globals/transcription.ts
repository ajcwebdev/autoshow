// src/utils/transcription-globals.ts

/**
 * @file Defines Deepgram and Assembly transcription model configurations,
 * including name, modelId, and cost per minute.
 */

import type { WhisperModelType, TranscriptServiceConfig } from '../types/transcription'
import type { DeepgramModelType, AssemblyModelType } from '../types/transcription'

/* ------------------------------------------------------------------
 * Transcription Services & Models
 * ------------------------------------------------------------------ */

/**
 * Available transcription services and their configuration.
 * 
 */
export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

/**
 * Array of valid transcription service values.
 * 
 */
export const TRANSCRIPT_OPTIONS: string[] = Object.values(TRANSCRIPT_SERVICES).map(
  (service) => service.value
)

/**
 * Whisper-only transcription services (subset of TRANSCRIPT_SERVICES).
 * 
 */
export const WHISPER_SERVICES: string[] = Object.values(TRANSCRIPT_SERVICES)
  .filter(
    (
      service
    ): service is TranscriptServiceConfig & {
      isWhisper: true
    } => service.isWhisper === true
  )
  .map((service) => service.value)

/**
 * Mapping of Whisper model types to their corresponding binary filenames for whisper.cpp.
 * @type {Record<WhisperModelType, string>}
 */
export const WHISPER_MODELS: Record<WhisperModelType, string> = {
  tiny: 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',
  base: 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',
  small: 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  medium: 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin',
  'large-v2': 'ggml-large-v2.bin',
  'large-v3-turbo': 'ggml-large-v3-turbo.bin',
  turbo: 'ggml-large-v3-turbo.bin',
}

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS: Record<DeepgramModelType, {
  name: string
  modelId: string
  costPerMinute: number
}> = {
  NOVA_2: {
    name: 'Nova-2',
    modelId: 'nova-2',
    costPerMinute: 0.0043
  },
  NOVA: {
    name: 'Nova',
    modelId: 'nova',
    costPerMinute: 0.0043
  },
  ENHANCED: {
    name: 'Enhanced',
    modelId: 'enhanced',
    costPerMinute: 0.0145
  },
  BASE: {
    name: 'Base',
    modelId: 'base',
    costPerMinute: 0.0125
  }
}

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS: Record<AssemblyModelType, {
  name: string
  modelId: string
  costPerMinute: number
}> = {
  BEST: {
    name: 'Best',
    modelId: 'best',
    costPerMinute: 0.0062
  },
  NANO: {
    name: 'Nano',
    modelId: 'nano',
    costPerMinute: 0.0020
  }
}