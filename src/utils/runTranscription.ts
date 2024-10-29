// src/utils/runTranscription.ts

/**
 * @file Orchestrator for running transcription services on audio files.
 * Manages the routing and execution of various transcription services,
 * both local and cloud-based.
 * @packageDocumentation
 */

import { callWhisper } from '../transcription/whisper.js'
import { callWhisperPython } from '../transcription/whisperPython.js'
import { callWhisperDocker } from '../transcription/whisperDocker.js'
import { callWhisperDiarization } from '../transcription/whisperDiarization.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'
import { log, step } from '../models.js'
import { TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Orchestrates the transcription process using the specified service.
 * Routes the transcription request to the appropriate service handler
 * and manages the execution process.
 * 
 * Available transcription services:
 * Local Services:
 * - whisper: Default Whisper.cpp implementation
 * - whisperDocker: Whisper.cpp running in Docker
 * - whisperPython: OpenAI's Python Whisper implementation
 * - whisperDiarization: Whisper with speaker diarization
 * 
 * Cloud Services:
 * - deepgram: Deepgram's API service
 * - assembly: AssemblyAI's API service
 * 
 * @param {ProcessingOptions} options - Configuration options including:
 *   - whisper: Whisper model specification
 *   - whisperDocker: Docker-based Whisper model
 *   - whisperPython: Python-based Whisper model
 *   - whisperDiarization: Diarization model
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
 *   - 'whisperPython': Python Whisper
 *   - 'whisperDiarization': Whisper with speaker detection
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
  frontMatter: string,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(step(`\nStep 3 - Running transcription on audio file using ${transcriptServices}...`))

  // Route to appropriate transcription service
  switch (transcriptServices) {
    case 'deepgram':
      // Cloud-based service with advanced features
      await callDeepgram(options, finalPath)
      break

    case 'assembly':
      // Cloud-based service with speaker diarization
      await callAssembly(options, finalPath)
      break

    case 'whisper':
      // Local Whisper.cpp implementation
      await callWhisper(options, finalPath)
      break

    case 'whisperDocker':
      // Containerized Whisper.cpp
      await callWhisperDocker(options, finalPath)
      break

    case 'whisperPython':
      // Original Python implementation
      await callWhisperPython(options, finalPath)
      break

    case 'whisperDiarization':
      // Whisper with speaker detection
      await callWhisperDiarization(options, finalPath)
      break

    default:
      throw new Error(`Unknown transcription service: ${transcriptServices}`)
  }
}