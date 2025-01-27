// src/utils/transcription-globals.ts

/**
 * @file Defines Deepgram and Assembly transcription model configurations,
 * including name, modelId, and cost per minute. Also provides
 * Whisper model mappings for whisper.cpp usage.
 */

import type { WhisperModelType, TranscriptServiceConfig, DeepgramModelType, AssemblyModelType } from '../types/transcription'

/* ------------------------------------------------------------------
 * Transcription Services & Models
 * ------------------------------------------------------------------ */

/**
 * Available transcription services and their configuration.
 */
export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

/**
 * Array of valid transcription service values.
 */
export const TRANSCRIPT_OPTIONS: string[] = Object.values(TRANSCRIPT_SERVICES)
  .map((service) => service.value)

/**
 * Whisper-only transcription services (subset of TRANSCRIPT_SERVICES).
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
 * Mapping of Whisper model flags (`--whisper=<model>`) to the actual
 * ggml binary filenames for whisper.cpp.
 */
export const WHISPER_MODELS: Record<WhisperModelType, string> = {
  // Tiny models
  tiny: 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',

  // Base models
  base: 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',

  // Small/Medium
  small: 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  medium: 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',

  // Large variations
  'large-v1': 'ggml-large-v1.bin',
  'large-v2': 'ggml-large-v2.bin',

  // Add or rename as needed:
  'large-v3-turbo': 'ggml-large-v3-turbo.bin',
  // Provide an alias if you like shorter flags:
  turbo: 'ggml-large-v3-turbo.bin',
}

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS: Record<
  DeepgramModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
  NOVA_2: {
    name: 'Nova-2',
    modelId: 'nova-2',
    costPerMinute: 0.0043,
  },
  NOVA: {
    name: 'Nova',
    modelId: 'nova',
    costPerMinute: 0.0043,
  },
  ENHANCED: {
    name: 'Enhanced',
    modelId: 'enhanced',
    costPerMinute: 0.0145,
  },
  BASE: {
    name: 'Base',
    modelId: 'base',
    costPerMinute: 0.0125,
  },
}

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS: Record<
  AssemblyModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
  BEST: {
    name: 'Best',
    modelId: 'best',
    costPerMinute: 0.0062,
  },
  NANO: {
    name: 'Nano',
    modelId: 'nano',
    costPerMinute: 0.002,
  },
}