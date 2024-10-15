// src/utils/runTranscription.ts

import { callWhisper } from '../transcription/whisper.js'
import { callWhisperPython } from '../transcription/whisperPython.js'
import { callWhisperDocker } from '../transcription/whisperDocker.js'
import { callWhisperDiarization } from '../transcription/whisperDiarization.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'
import { log, step } from '../models.js'
import { TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Manages the transcription process based on the selected service.
 * @param {ProcessingOptions} options - The processing options.
 * * @param {TranscriptServices} transcriptServices - The transcription service to use.
 * @param {string} finalPath - The base path for the files.
 * @returns {Promise<void>}
 */
export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  transcriptServices?: TranscriptServices
): Promise<void> {
  log(step(`\nStep 3 - Running transcription on audio file using ${transcriptServices}...`))

  // Choose the transcription service based on the provided option
  switch (transcriptServices) {
    case 'deepgram':
      await callDeepgram(options, finalPath)
      break
    case 'assembly':
      await callAssembly(options, finalPath)
      break
    case 'whisper':
      await callWhisper(options, finalPath)
      break
    case 'whisperDocker':
      await callWhisperDocker(options, finalPath)
      break
    case 'whisperPython':
      await callWhisperPython(options, finalPath)
      break
    case 'whisperDiarization':
      await callWhisperDiarization(options, finalPath)
      break
    default:
      throw new Error(`Unknown transcription service: ${transcriptServices}`)
  }
}