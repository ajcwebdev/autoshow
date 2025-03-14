// src/process-steps/03-run-transcription.ts

import { callWhisper } from '../transcription/whisper'
import { callDeepgram } from '../transcription/deepgram'
import { callAssembly } from '../transcription/assembly'
import { retryTranscriptionCall } from './03-run-transcription-utils'
import { l, err, logInitialFunctionCall } from '../utils/logging'

import type { ProcessingOptions } from '../utils/types'

/**
 * Orchestrates the transcription process using the specified service.
 * Routes the transcription request to the appropriate service handler
 * and manages the execution process.
 * 
 * @param {ProcessingOptions} options - Configuration options
 * @param {string} finalPath - Base path for input/output files
 * @param {string} [transcriptServices] - The transcription service to use
 * @returns {Promise<string>} The complete transcript
 */
export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices?: string
) {
  l.step(`\nStep 3 - Run Transcription\n`)
  logInitialFunctionCall('runTranscription', { options, finalPath, transcriptServices })

  try {
    switch (transcriptServices) {
      case 'deepgram':
        const deepgramModel = typeof options.deepgram === 'string' ? options.deepgram : 'nova-2'
        // Convert string model to enum key if needed
        const normalizedDeepgramModel = deepgramModel === 'nova-2' || deepgramModel === 'Nova-2' ? 'nova-2' :
                                        deepgramModel === 'base' || deepgramModel === 'Base' ? 'BASE' :
                                        deepgramModel === 'enhanced' || deepgramModel === 'Enhanced' ? 'ENHANCED' : 
                                        deepgramModel as 'nova-2' | 'BASE' | 'ENHANCED'
        
        const deepgramTranscript = await retryTranscriptionCall(
          () => callDeepgram(options, finalPath, normalizedDeepgramModel)
        )
        l.dim('\n  Deepgram transcription completed successfully.\n')
        l.dim(`\n    - deepgramModel: ${deepgramModel}`)
        return deepgramTranscript

      case 'assembly':
        const assemblyModel = typeof options.assembly === 'string' ? options.assembly : 'NANO'
        // Convert string model to enum key if needed
        const normalizedAssemblyModel = assemblyModel === 'best' || assemblyModel === 'Best' ? 'BEST' :
                                        assemblyModel === 'nano' || assemblyModel === 'Nano' ? 'NANO' : 
                                        assemblyModel as 'BEST' | 'NANO'
        
        const assemblyTranscript = await retryTranscriptionCall(
          () => callAssembly(options, finalPath, normalizedAssemblyModel)
        )
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        l.dim(`\n    - assemblyModel: ${assemblyModel}`)
        return assemblyTranscript

      case 'whisper':
        const whisperTranscript = await retryTranscriptionCall(
          () => callWhisper(options, finalPath)
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