// src/transcription/whisper.ts

/**
 * This file manages transcription using local Whisper.cpp.
 * It provides a streamlined, single-container approach for audio transcription.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { lrcToTxt } from '../utils/format-transcript'
import { WHISPER_MODELS, execPromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../types/process'
import type { WhisperModelType, WhisperRunner } from '../types/transcription'

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
  l.wait('\n  Using local whisper.cpp for transcription...')

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

    l.wait(`\n    - whisperModel: ${whisperModel}`)

    // Execute the local whisper.cpp runner
    await runWhisperCpp(finalPath, whisperModel)

    // Read the newly created .txt file
    const txtContent = await readFile(`${finalPath}.txt`, 'utf8')
    return txtContent

  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}

/**
 * Runs transcription using the local whisper.cpp build inside this container.
 * 
 * Steps:
 * 1. If whisper.cpp is not cloned/built locally, do so.
 * 2. Download model if not present.
 * 3. Invoke whisper.cpp to create an LRC file.
 * 4. Convert LRC to plain text for final transcript.
 */
const runWhisperCpp: WhisperRunner = async (finalPath, whisperModel) => {
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  l.wait(`    - modelGGMLName: ${modelGGMLName}`)

  // Check if whisper.cpp directory is present
  if (!existsSync('./whisper.cpp')) {
    l.wait(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp')
    l.wait(`\n    - whisper.cpp clone and compilation complete.\n`)
  }

  // Check if the chosen model file is present
  if (!existsSync(`./whisper.cpp/models/${modelGGMLName}`)) {
    l.wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`)
    await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
    l.wait('    - Model download completed, running transcription...\n')
  }

  // Run whisper.cpp on the WAV file
  await execPromise(
    `./whisper.cpp/build/bin/whisper-cli ` +
    `-m "whisper.cpp/models/${modelGGMLName}" ` +
    `-f "${finalPath}.wav" ` +
    `-of "${finalPath}" ` +
    `--output-lrc`
  )
  l.success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`)

  // Convert .lrc -> .txt
  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l.success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`)
}