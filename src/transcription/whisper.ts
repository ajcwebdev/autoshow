// src/transcription/whisper.ts

/**
 * This file manages transcription using local Whisper.cpp.
 * It provides a streamlined, single-container approach for audio transcription.
 */

import { readFile, unlink } from 'node:fs/promises'
import { checkWhisperDirAndModel } from '../utils/step-utils/transcription-utils'
import { WHISPER_MODELS } from '../../shared/constants'
import { execPromise } from '../utils/validate-option'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/step-types'

/**
 * Main function to handle transcription using local Whisper.cpp.
 * @param {ProcessingOptions} options - Processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @returns {Promise<string>} - The formatted transcript content as a string.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string
) {
  l.opts('\n  callWhisper called with arguments:')
  l.opts(`    - finalPath: ${finalPath}`)

  try {
    // Determine which model was requested (default to "base" if `--whisper` is passed with no model)
    const whisperModel = typeof options.whisper === 'string'
      ? options.whisper
      : options.whisper === true
        ? 'base'
        : (() => { throw new Error('Invalid whisper option') })()

    // Lookup the model entry from the shared constants array
    const whisperModelEntry = WHISPER_MODELS.find(m => m.value === whisperModel)
    if (!whisperModelEntry) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    l.dim(`\n  Whisper model information:\n\n    - whisperModel: ${whisperModel}`)
    l.dim(`    - modelGGMLName: ${whisperModelEntry.bin}`)

    await checkWhisperDirAndModel(whisperModelEntry.value, whisperModelEntry.bin)

    // Run whisper.cpp on the WAV file
    l.dim(`  Invoking whisper.cpp on file:\n    - ${finalPath}.wav`)
    try {
      await execPromise(
        `./whisper.cpp/build/bin/whisper-cli --no-gpu ` +
        `-m "whisper.cpp/models/${whisperModelEntry.bin}" ` +
        `-f "${finalPath}.wav" ` +
        `-of "${finalPath}" ` +
        `--output-lrc`
      )
    } catch (whisperError) {
      err(`Error running whisper.cpp: ${(whisperError as Error).message}`)
      throw whisperError
    }

    l.dim(`\n  Transcript LRC file successfully created, reading file for txt conversion:\n    - ${finalPath}.lrc\n`)
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = `${lrcContent}`
    await unlink(`${finalPath}.lrc`)

    // Return the transcript text
    return txtContent
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}