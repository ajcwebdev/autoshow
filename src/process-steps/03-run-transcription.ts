// src/process-steps/03-run-transcription.ts

import { readFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper'
import { callDeepgram } from '../transcription/deepgram'
import { callAssembly } from '../transcription/assembly'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices } from '../types/transcription'

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
): Promise<string> {
  // Log function call
  l.step('\nStep 3 - Run Transcription\n')
  l.wait('\n  runTranscription called with arguments:\n')
  l.wait(`    - finalPath: ${finalPath}`)
  l.wait(`    - transcriptServices: ${transcriptServices}`)

  try {
    switch (transcriptServices) {
      case 'deepgram':
        // Deepgram might write the .txt file to disk. Then read it.
        await callDeepgram(finalPath)
        l.success('\nDeepgram transcription completed successfully.\n')
        // Read the transcript from file (if that's how Deepgram is implemented)
        return readFile(`${finalPath}.txt`, 'utf8')

      case 'assembly':
        // Assembly might write the .txt file to disk. Then read it.
        await callAssembly(options, finalPath)
        l.success('\nAssemblyAI transcription completed successfully.\n')
        // Read the transcript from file
        return readFile(`${finalPath}.txt`, 'utf8')

      case 'whisper':
        // Call whisper and return the final text content in memory
        const whisperTranscript = await callWhisper(options, finalPath)
        l.wait('\n  Whisper transcription completed successfully.\n')
        return whisperTranscript

      default:
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}