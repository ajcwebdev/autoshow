// src/transcription/whisper.ts

/**
 * This file manages transcription using local Whisper.cpp.
 * It provides a streamlined, single-container approach for audio transcription.
 */

import { readFile, unlink } from 'node:fs/promises'
import { WHISPER_MODELS, checkWhisperDirAndModel } from '../utils/transcription-utils'
import { execPromise } from '../utils/validate-option'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/process'
import type { WhisperModelType } from '../utils/types/transcription'

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

    // Validate that the requested model is in our known model list
    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    l.dim(`\n  Whisper model information:\n\n    - whisperModel: ${whisperModel}`)

    const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
    l.dim(`    - modelGGMLName: ${modelGGMLName}`)

    await checkWhisperDirAndModel(whisperModel, modelGGMLName)

    // Run whisper.cpp on the WAV file
    l.dim(`  Invoking whisper.cpp on file:\n    - ${finalPath}.wav`)
    try {
      await execPromise(
        `./whisper.cpp/build/bin/whisper-cli --no-gpu ` +
        `-m "whisper.cpp/models/${modelGGMLName}" ` +
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
    // l.dim(lrcContent)
    const txtContent = `${lrcContent}`
    await unlink(`${finalPath}.lrc`)

    // Return the transcript text
    return txtContent
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}