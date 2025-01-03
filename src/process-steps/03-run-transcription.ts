// src/process-steps/03-run-transcription.ts

/**
 * @file Orchestrator for running transcription services on audio files.
 * Manages the routing and execution of various transcription services,
 * both local and cloud-based.
 * @packageDocumentation
 */

import { callWhisper } from '../transcription/whisper'
import { callDeepgram } from '../transcription/deepgram'
import { callAssembly } from '../transcription/assembly'
import { l } from '../utils/logging'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices } from '../types/transcription'

/**
 * Orchestrates the transcription process using the specified service.
 * Routes the transcription request to the appropriate service handler
 * and manages the execution process.
 * 
 * Available transcription services:
 * Local Services:
 * - whisper: Default Whisper.cpp implementation
 * - whisperDocker: Whisper.cpp running in Docker
 * 
 * Cloud Services:
 * - deepgram: Deepgram's API service
 * - assembly: AssemblyAI's API service
 * 
 * @param {ProcessingOptions} options - Configuration options including:
 *   - whisper: Whisper model specification
 *   - whisperDocker: Docker-based Whisper model
 *   - speakerLabels: Enable speaker detection (Assembly)
 *   - Additional service-specific options
 * 
 * @param {string} finalPath - Base path for input/output files:
 *   - Input audio: `${finalPath}.wav`
 *   - Output transcript: `${finalPath}.txt`
 * 
 * @param {string} frontMatter - YAML front matter content for the transcript
 *                              (Reserved for future use with metadata)
 * 
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use:
 *   - 'whisper': Local Whisper.cpp
 *   - 'whisperDocker': Containerized Whisper
 *   - 'deepgram': Deepgram API
 *   - 'assembly': AssemblyAI API
 * 
 * @returns {Promise<void>} Resolves when transcription is complete
 * 
 * @throws {Error} If:
 *   - Unknown transcription service is specified
 *   - Service-specific initialization fails
 *   - Transcription process fails
 *   - File operations fail
 * 
 * @example
 * // Using local Whisper
 * await runTranscription(
 *   { whisper: 'base' },
 *   'content/my-video',
 *   '---\ntitle: My Video\n---',
 *   'whisper'
 * )
 * 
 * @example
 * // Using AssemblyAI with speaker labels
 * await runTranscription(
 *   { speakerLabels: true },
 *   'content/my-video',
 *   '---\ntitle: My Video\n---',
 *   'assembly'
 * )
 */
export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices?: TranscriptServices
): Promise<void> {
  l.step(`\nStep 3 - Running transcription on audio file using ${transcriptServices}...`)

  // Route to appropriate transcription service
  switch (transcriptServices) {
    case 'deepgram':
      // Cloud-based service with advanced features
      await callDeepgram(finalPath)
      break

    case 'assembly':
      // Cloud-based service with speaker diarization
      await callAssembly(options, finalPath)
      break

    case 'whisper':
      // Local transcription with whisper.cpp
      await callWhisper(options, finalPath)
      break

    default:
      throw new Error(`Unknown transcription service: ${transcriptServices}`)
  }
}