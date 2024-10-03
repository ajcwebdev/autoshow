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
  tiny: 'ggml-tiny.bin', 'tiny.en': 'ggml-tiny.en.bin',
  base: 'ggml-base.bin', 'base.en': 'ggml-base.en.bin',
  small: 'ggml-small.bin', 'small.en': 'ggml-small.en.bin',
  medium: 'ggml-medium.bin', 'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin', 'large-v2': 'ggml-large-v2.bin',
  large: 'ggml-large-v2.bin',
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
    // Get the whisper model from options or use 'base' as default
    const whisperModel = options.whisperModel || 'base'
    
    // Check if the selected model is valid
    if (!(whisperModel in WHISPER_MODELS)) throw new Error(`Unknown model type: ${whisperModel}`)

    // Get the model file name
    const modelName = WHISPER_MODELS[whisperModel]
    
    // Adjust download model name for 'large' model
    const downloadModelName = whisperModel === 'large' ? 'large-v2' : whisperModel

    // Call appropriate Whisper function based on transcriptOpt
    await (transcriptOpt === 'whisperDocker' ? callWhisperDocker : callWhisperMain)(finalPath, modelName, downloadModelName)

    // Read the generated LRC file
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    
    // Process and format the LRC content
    const txtContent = lrcContent.split('\n')
      .filter(line => !line.startsWith('[by:whisper.cpp]')) // Remove whisper.cpp attribution
      .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`)) // Simplify timestamp format
      .join('\n')

    // Write the formatted content to a text file
    await writeFile(`${finalPath}.txt`, txtContent)
    
    // Log completion message
    console.log(`  - Transcript transformation completed at ${finalPath}.txt`)
    
    // Return the processed content
    return txtContent
  } catch (error) {
    // Log any errors and exit the process
    console.error('Error in callWhisper:', error)
    process.exit(1)
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
async function callWhisperDocker(finalPath, modelName, downloadModelName) {
  // Define constants for Docker setup
  const WHISPER_CONTAINER_NAME = 'autoshow-whisper-1'
  const CONTENT_DIR = '/app/content'
  const MODELS_DIR = '/app/models'
  const modelPathContainer = `${MODELS_DIR}/${modelName}`

  try {
    // Check if Whisper container is running, start it if not
    await execPromise(`docker ps | grep ${WHISPER_CONTAINER_NAME}`)
      .catch(() => execPromise('docker-compose up -d whisper'))

    // Check if the model exists in the container, download if not
    await execPromise(`docker exec ${WHISPER_CONTAINER_NAME} test -f ${modelPathContainer}`)
      .catch(() => execPromise(`docker exec ${WHISPER_CONTAINER_NAME} ${MODELS_DIR}/download-ggml-model.sh ${downloadModelName}`))

    // Get the base filename
    const fileName = basename(finalPath)
    
    // Execute Whisper transcription in Docker
    await execPromise(`docker exec ${WHISPER_CONTAINER_NAME} /app/main -m ${modelPathContainer} -f ${join(CONTENT_DIR, `${fileName}.wav`)} -of ${join(CONTENT_DIR, fileName)} --output-lrc`)
    
    // Log completion message
    console.log(`  - Transcript LRC file completed at ${finalPath}.lrc`)
  } catch (error) {
    // Log any errors and re-throw
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
async function callWhisperMain(finalPath, modelName, downloadModelName) {
  // Define the path for the Whisper model
  const modelPath = `./whisper.cpp/models/${modelName}`

  try {
    // Check if whisper.cpp directory exists, clone and build if not
    await access('./whisper.cpp').catch(async () => {
      // Clone, build, and setup whisper.cpp
      await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp && cp .github/whisper.Dockerfile whisper.cpp/Dockerfile')
    })

    // Check if the model exists locally, download if not
    await access(modelPath).catch(async () => {
      // Download the model
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${downloadModelName}`)
    })

    // Execute Whisper transcription
    await execPromise(`./whisper.cpp/main -m "whisper.cpp/models/${modelName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`)
    
    // Log completion message
    console.log(`  - Transcript LRC file completed at ${finalPath}.lrc`)
  } catch (error) {
    // Log any errors and re-throw
    console.error('Error in callWhisperMain:', error)
    throw error
  }
}