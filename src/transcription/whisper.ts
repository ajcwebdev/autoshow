// src/transcription/whisper.ts

// This file manages transcription using various Whisper-based methods:
// - whisper: Local whisper.cpp
// - whisperDocker: Whisper.cpp inside Docker

// Steps:
// 1. Based on the provided transcriptServices option, determine which Whisper runner to use.
// 2. Execute the selected runner, which handles model setup, transcription execution, and initial output.
// 3. Each runner produces either an LRC or SRT file, which we then convert into a formatted TXT file
//    using lrcToTxt or srtToTxt from transcription-utils.
// 4. Return the final TXT content.

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { lrcToTxt } from '../utils/format-transcript'
import { WHISPER_MODELS, execPromise } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../types/main'
import type { WhisperModelType, WhisperTranscriptServices, WhisperRunner } from '../types/transcript-service-types'

/**
 * Main function to handle transcription using various Whisper-based methods.
 *
 * @param {ProcessingOptions} options - Additional processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @param {WhisperTranscriptServices} transcriptServices - The chosen Whisper-based transcription method to use.
 * @returns {Promise<string>} A promise that resolves to the formatted transcript content as a string.
 * @throws {Error} If an invalid transcription option or model is provided, or if any processing error occurs.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices: WhisperTranscriptServices
): Promise<string> {
  l.wait(`\n  Using ${transcriptServices} for transcription...`)
  
  try {
    const serviceConfig = {
      whisper: {
        option: options.whisper,
        modelList: WHISPER_MODELS,
        runner: runWhisperCpp
      },
      whisperDocker: {
        option: options.whisperDocker,
        modelList: WHISPER_MODELS,
        runner: runWhisperDocker
      },
    } as const

    const config = serviceConfig[transcriptServices]

    const whisperModel = typeof config.option === 'string' 
      ? config.option
      : config.option === true 
        ? 'base'
        : (() => { throw new Error(`Invalid ${transcriptServices} option`) })()

    if (!(whisperModel in config.modelList)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    l.wait(`\n    - whisperModel: ${whisperModel}`)
    
    await config.runner(finalPath, whisperModel)

    const txtContent = await readFile(`${finalPath}.txt`, 'utf8')
    return txtContent
  } catch (error) {
    err(`Error in callWhisper with ${transcriptServices}:`, (error as Error).message)
    process.exit(1)
  }
}

/**
 * Runs transcription using the local whisper.cpp implementation.
 *
 * This runner:
 * - Ensures whisper.cpp is cloned and built if it does not exist.
 * - Ensures the specified Whisper model is downloaded.
 * - Runs whisper.cpp to produce an LRC file from the provided WAV file.
 * - Converts the resulting LRC file to TXT format using `lrcToTxt`.
 * - Saves the TXT file to disk.
 *
 * @param {string} finalPath - The base filename (without extension) of the input (WAV) and output files.
 * @param {string} whisperModel - The Whisper model name to use (e.g., "base", "small").
 * @returns {Promise<void>} A promise that resolves when the transcription process is complete.
 * @throws {Error} If cloning, building, downloading model, or running whisper.cpp fails.
 */
const runWhisperCpp: WhisperRunner = async (finalPath, whisperModel) => {
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  l.wait(`    - modelGGMLName: ${modelGGMLName}`)

  if (!existsSync('./whisper.cpp')) {
    l.wait(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp')
    l.wait(`\n    - whisper.cpp clone and compilation complete.\n`)
  }

  if (!existsSync(`./whisper.cpp/models/${modelGGMLName}`)) {
    l.wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`)
    await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
    l.wait('    - Model download completed, running transcription...\n')
  }

  await execPromise(`./whisper.cpp/build/bin/whisper-cli -m "whisper.cpp/models/${modelGGMLName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`)
  l.success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`)

  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l.success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`)
}

/**
 * Runs transcription using whisper.cpp inside a Docker container.
 *
 * This runner:
 * - Ensures the Docker container with whisper.cpp is running.
 * - Ensures the specified Whisper model is present inside the container, downloading it if needed.
 * - Runs whisper.cpp inside the container to produce an LRC file.
 * - Converts the LRC file to TXT format using `lrcToTxt`.
 * - Saves the TXT file to disk.
 *
 * @param {string} finalPath - The base filename (without extension) of the input (WAV) and output files.
 * @param {string} whisperModel - The Whisper model name to use.
 * @returns {Promise<void>} A promise that resolves when the transcription process is complete.
 * @throws {Error} If the Docker container isn't running, the model cannot be downloaded, or whisper.cpp fails inside Docker.
 */
const runWhisperDocker: WhisperRunner = async (finalPath, whisperModel) => {
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  const CONTAINER_NAME = 'autoshow-whisper-1'
  const modelPathContainer = `/app/models/${modelGGMLName}`

  l.wait(`    - modelGGMLName: ${modelGGMLName}`)
  l.wait(`    - CONTAINER_NAME: ${CONTAINER_NAME}`)
  l.wait(`    - modelPathContainer: ${modelPathContainer}`)

  await execPromise(`docker ps | grep ${CONTAINER_NAME}`)
    .catch(() => execPromise('docker-compose up -d whisper'))

  await execPromise(`docker exec ${CONTAINER_NAME} test -f ${modelPathContainer}`)
    .catch(() => execPromise(`docker exec ${CONTAINER_NAME} /app/models/download-ggml-model.sh ${whisperModel}`))

  await execPromise(
    `docker exec ${CONTAINER_NAME} /app/build/bin/whisper-cli -m ${modelPathContainer} -f "/app/content/${finalPath.split('/').pop()}.wav" -of "/app/content/${finalPath.split('/').pop()}" --output-lrc`
  )
  l.success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`)

  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l.success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`)
}