// src/transcription/whisper.ts

/**
 * This file manages transcription using local Whisper.cpp.
 * It provides a streamlined, single-container approach for audio transcription.
 */

import { readFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { lrcToTxt } from '../utils/format-transcript'
import { WHISPER_MODELS, execPromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../types/process'
import type { WhisperModelType } from '../types/transcription'

/**
 * Main function to handle transcription using local Whisper.cpp.
 * @param {ProcessingOptions} options - Processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @returns {Promise<string>} - The formatted transcript content as a string.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string
): Promise<string> {
  l.wait('\n  callWhisper called with arguments:\n')
  l.wait(`    - finalPath: ${finalPath}`)

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

    l.wait(`\n  Whisper model information:\n\n    - whisperModel: ${whisperModel}`)

    const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
    l.wait(`    - modelGGMLName: ${modelGGMLName}`)

    // Check if whisper.cpp directory is present
    if (!existsSync('./whisper.cpp')) {
      l.wait(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
      try {
        await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp')
        l.wait(`\n    - whisper.cpp clone and compilation complete.\n`)
      } catch (cloneError) {
        err(`Error cloning/building whisper.cpp: ${(cloneError as Error).message}`)
        throw cloneError
      }
    }

    // Check if the chosen model file is present
    if (!existsSync(`./whisper.cpp/models/${modelGGMLName}`)) {
      l.wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`)
      try {
        await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
        l.wait('    - Model download completed, running transcription...\n')
      } catch (modelError) {
        err(`Error downloading model: ${(modelError as Error).message}`)
        throw modelError
      }
    }

    // Run whisper.cpp on the WAV file
    l.wait(`\n  Invoking whisper.cpp on file:\n    - ${finalPath}.wav`)
    try {
      await execPromise(
        `./whisper.cpp/build/bin/whisper-cli --no-gpu ` +
        `-m "whisper.cpp/models/${modelGGMLName}" ` +
        `-f "${finalPath}.wav" ` +
        `-of "${finalPath}" ` +  // Output file base name
        `--output-lrc`           // Output LRC file
      )
    } catch (whisperError) {
      err(`Error running whisper.cpp: ${(whisperError as Error).message}`)
      throw whisperError
    }

    // Convert .lrc -> .txt
    l.wait(`\n  Transcript LRC file successfully created, reading file for txt conversion:\n    - ${finalPath}.lrc`)
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = lrcToTxt(lrcContent)
    await unlink(`${finalPath}.lrc`)

    // Return the transcript text
    l.wait('  Returning transcript text from callWhisper...')
    return txtContent
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}