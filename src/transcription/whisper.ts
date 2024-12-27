// src/transcription/whisper.ts

/**
 * This file manages transcription using various Whisper-based methods:
 * - `whisper`: Local whisper.cpp (recommended for single-container approach)
 * - `whisperDocker`: Whisper.cpp inside Docker (legacy / fallback)
 *
 * In a single-container setup, you'll typically ONLY use `whisper`.
 * The `whisperDocker` runner here is kept for backward compatibility.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { lrcToTxt } from '../utils/format-transcript'
import { WHISPER_MODELS, execPromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../types/process'
import type { WhisperModelType, WhisperTranscriptServices, WhisperRunner } from '../types/transcription'

/**
 * Main function to handle transcription using various Whisper-based methods.
 * @param {ProcessingOptions} options - Additional processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @param {WhisperTranscriptServices} transcriptServices - The chosen Whisper-based transcription method to use.
 * @returns {Promise<string>} - The formatted transcript content as a string.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices: WhisperTranscriptServices
): Promise<string> {
  l.wait(`\n  Using ${transcriptServices} for transcription...`)

  try {
    // Config object: each property points to a different runner
    const serviceConfig = {
      whisper: {
        option: options.whisper,      // e.g. '--whisper base'
        modelList: WHISPER_MODELS,
        runner: runWhisperCpp,        // Local runner
      },
      whisperDocker: {
        option: options.whisperDocker, // e.g. '--whisperDocker base'
        modelList: WHISPER_MODELS,
        runner: runWhisperDocker,      // Docker runner (NOT recommended in single-container approach)
      },
    } as const

    const config = serviceConfig[transcriptServices]

    // Determine which model was requested (default to "base" if `--whisper` is passed with no model)
    const whisperModel = typeof config.option === 'string'
      ? config.option
      : config.option === true
        ? 'base'
        : (() => { throw new Error(`Invalid ${transcriptServices} option`) })()

    // Validate that the requested model is in our known model list
    if (!(whisperModel in config.modelList)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    l.wait(`\n    - whisperModel: ${whisperModel}`)

    // Execute the appropriate runner function (local or Docker)
    await config.runner(finalPath, whisperModel)

    // Read the newly created .txt file
    const txtContent = await readFile(`${finalPath}.txt`, 'utf8')
    return txtContent

  } catch (error) {
    err(`Error in callWhisper with ${transcriptServices}:`, (error as Error).message)
    process.exit(1)
  }
}

/**
 * Runs transcription using the **local** whisper.cpp build inside this container.
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

/**
 * Runs transcription by calling Whisper.cpp in a separate Docker container.
 * 
 * In a single-container approach, this is typically unused. If you keep this around
 * for legacy reasons, you’ll see that it tries to `docker exec autoshow-whisper-1 ...`.
 * 
 * If you’re no longer spinning up the separate `whisper` container, do NOT use `--whisperDocker`.
 */
const runWhisperDocker: WhisperRunner = async (finalPath, whisperModel) => {
  // *** This is mostly for reference/legacy ***
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  const CONTAINER_NAME = 'autoshow-whisper-1'
  const modelPathContainer = `/app/models/${modelGGMLName}`

  l.wait(`    - modelGGMLName: ${modelGGMLName}`)
  l.wait(`    - CONTAINER_NAME: ${CONTAINER_NAME}`)
  l.wait(`    - modelPathContainer: ${modelPathContainer}`)

  // Check if container is running; if not, we try to do `docker-compose up -d whisper`
  await execPromise(`docker ps | grep ${CONTAINER_NAME}`)
    .catch(() => execPromise('docker-compose up -d whisper'))

  // Check if model is present inside container; if not, download it
  await execPromise(`docker exec ${CONTAINER_NAME} test -f ${modelPathContainer}`)
    .catch(() => execPromise(`docker exec ${CONTAINER_NAME} /app/models/download-ggml-model.sh ${whisperModel}`))

  // Run the CLI inside the whisper container
  await execPromise(
    `docker exec ${CONTAINER_NAME} ` +
    `/app/build/bin/whisper-cli ` +
    `-m ${modelPathContainer} ` +
    `-f "/app/content/${finalPath.split('/').pop()}.wav" ` +
    `-of "/app/content/${finalPath.split('/').pop()}" ` +
    `--output-lrc`
  )
  l.success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`)

  // Back on the host side, read .lrc and convert to .txt
  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l.success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`)
}