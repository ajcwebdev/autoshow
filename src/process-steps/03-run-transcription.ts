// src/process-steps/03-run-transcription.ts

import { callWhisper } from '../transcription/whisper'
import { callDeepgram } from '../transcription/deepgram'
import { callAssembly } from '../transcription/assembly'
import { l, err, logInitialFunctionCall } from '../utils/logging'
import { retryTranscriptionCall } from '../utils/step-utils/retry'
import type { ProcessingOptions } from '../utils/types/step-types'
import type { TranscriptServices } from '../utils/types/transcription'

/**
 * Orchestrates the transcription process using the specified service.
 * Routes the transcription request to the appropriate service handler
 * and manages the execution process.
 * 
 * @param {ProcessingOptions} options - Configuration options
 * @param {string} finalPath - Base path for input/output files
 * @param {TranscriptServices} [transcriptServices] - The transcription service to use
 * @returns {Promise<string>} The complete transcript
 */
export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices?: TranscriptServices
) {
  l.step(`\nStep 3 - Run Transcription\n`)
  logInitialFunctionCall('runTranscription', { options, finalPath, transcriptServices })

  try {
    switch (transcriptServices) {
      case 'deepgram':
        const deepgramModel = typeof options.deepgram === 'string' ? options.deepgram : 'NOVA_2'
        const deepgramTranscript = await retryTranscriptionCall(
          () => callDeepgram(options, finalPath, deepgramModel),
          5,
          5000
        )
        l.dim('\n  Deepgram transcription completed successfully.\n')
        l.dim(`\n    - deepgramModel: ${deepgramModel}`)
        return deepgramTranscript

      case 'assembly':
        const assemblyModel = typeof options.assembly === 'string' ? options.assembly : 'NANO'
        const assemblyTranscript = await retryTranscriptionCall(
          () => callAssembly(options, finalPath, assemblyModel),
          5,
          5000
        )
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        l.dim(`\n    - assemblyModel: ${assemblyModel}`)
        return assemblyTranscript

      case 'whisper':
        const whisperTranscript = await retryTranscriptionCall(
          () => callWhisper(options, finalPath),
          5,
          5000
        )
        l.dim('\n  Whisper transcription completed successfully.\n')
        return whisperTranscript

      default:
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}