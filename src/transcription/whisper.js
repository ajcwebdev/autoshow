// src/transcription/whisper.js

import { readFile, writeFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { basename, join } from 'node:path'

const execPromise = promisify(exec)

/** @import { TranscriptOption, ProcessingOptions, WhisperModelType } from '../types.js' */

/**
 * Define available Whisper models
 * @type {Record<WhisperModelType, string>}
 */
const WHISPER_MODELS = {
  'tiny': 'ggml-tiny.bin', 'tiny.en': 'ggml-tiny.en.bin',
  'base': 'ggml-base.bin', 'base.en': 'ggml-base.en.bin',
  'small': 'ggml-small.bin', 'small.en': 'ggml-small.en.bin',
  'medium': 'ggml-medium.bin', 'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin', 'large-v2': 'ggml-large-v2.bin',
  'large': 'ggml-large-v2.bin',
}

/**
 * Main function to handle transcription using Whisper.
 * @param {string} finalPath - The base path for the files.
 * @param {TranscriptOption} transcriptOpt - The transcription service to use.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisper(finalPath, transcriptOpt, options) {
  try {
    /** @type {WhisperModelType} */
    const whisperModel = options.whisper || options.whisperDocker || 'base'
    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }
    const modelName = WHISPER_MODELS[whisperModel]

    // Call the appropriate Whisper function based on the transcription service
    if (transcriptOpt === 'whisperDocker') {
      await callWhisperDocker(finalPath, modelName, whisperModel)
    } else {
      await callWhisperMain(finalPath, modelName, whisperModel)
    }

    // Read, process, and format the generated LRC file
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = lrcContent.split('\n')
      .filter((line) => !line.startsWith('[by:whisper.cpp]'))
      .map((line) => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
      .join('\n')

    // Write the formatted content to a text file
    await writeFile(`${finalPath}.txt`, txtContent)
    console.log(`Transcript transformation completed:\n  - ${finalPath}.txt`)
    return txtContent
  } catch (error) {
    console.error('Error in callWhisper:', error)
    throw error
  }
}

/**
 * Function to handle Whisper transcription using Docker.
 * @param {string} finalPath - The base path for the files.
 * @param {string} modelName - The model file name.
 * @param {WhisperModelType} whisperModel - The Whisper model type.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during Docker transcription.
 */
async function callWhisperDocker(finalPath, modelName, whisperModel) {
  const WHISPER_CONTAINER_NAME = 'autoshow-whisper-1'
  const CONTENT_DIR = '/app/content'
  const MODELS_DIR = '/app/models'
  const modelPathContainer = `${MODELS_DIR}/${modelName}`

  try {
    // Check if the Whisper container is running, start it if not
    try {
      await execPromise(`docker ps | grep ${WHISPER_CONTAINER_NAME}`)
      console.log('\nWhisper container is already running.')
    } catch {
      console.log('\nWhisper container is not running. Starting it...')
      await execPromise('docker-compose up -d whisper')
      console.log('Whisper container started successfully.')
    }

    // Check if the model exists in the container, download if not
    try {
      await execPromise(`docker exec ${WHISPER_CONTAINER_NAME} test -f ${modelPathContainer}`)
      console.log(`\nWhisper.cpp ${whisperModel} model found:`)
      console.log(`  - ${modelName} model selected\n  - Model located at ${modelPathContainer}`)
    } catch {
      console.log(`\nWhisper.cpp ${whisperModel} model not found in container:`)
      console.log(`  - ${modelName} model selected\n  - Model downloading to ${modelPathContainer}`)
      await execPromise(`docker exec ${WHISPER_CONTAINER_NAME} ${MODELS_DIR}/download-ggml-model.sh ${whisperModel}`)
      console.log(`  - Model downloaded successfully`)
    }

    // Execute Whisper transcription in the Docker container
    const fileName = basename(finalPath)
    await execPromise(
      `docker exec ${WHISPER_CONTAINER_NAME} /app/main \
        -m ${modelPathContainer} \
        -f ${join(CONTENT_DIR, `${fileName}.wav`)} \
        -of ${join(CONTENT_DIR, fileName)} \
        --output-lrc`
    )
    console.log(`\nTranscript LRC file completed:\n  - ${finalPath}.lrc`)
  } catch (error) {
    console.error('Error in callWhisperDocker:', error)
    throw error
  }
}

/**
 * Function to handle Whisper transcription without Docker.
 * @param {string} finalPath - The base path for the files.
 * @param {string} modelName - The model file name.
 * @param {WhisperModelType} whisperModel - The Whisper model type.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during transcription.
 */
async function callWhisperMain(finalPath, modelName, whisperModel) {
  const modelPath = `./whisper.cpp/models/${modelName}`

  try {
    // Check if the model exists locally, download if not
    try {
      await access(modelPath)
      console.log(`\nWhisper.cpp ${whisperModel} model found:`)
      console.log(`  - ${modelName} model selected\n  - Model located at ${modelPath}`)
    } catch {
      console.log(`\nWhisper.cpp ${whisperModel} model not found:`)
      console.log(`  - ${modelName} model selected\n  - Model downloading to ${modelPath}`)
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
      console.log(`  - Model downloaded successfully`)
    }

    // Execute Whisper transcription
    await execPromise(
      `./whisper.cpp/main -m "whisper.cpp/models/${modelName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`
    )
    console.log(`\nTranscript LRC file completed:\n  - ${finalPath}.lrc`)
  } catch (error) {
    console.error('Error in callWhisperMain:', error)
    throw error
  }
}