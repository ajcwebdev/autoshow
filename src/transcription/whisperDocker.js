// src/transcription/whisperDocker.js

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { basename, join } from 'node:path'
import { WHISPER_MODELS } from '../types.js'

const execPromise = promisify(exec)

/** @import { ProcessingOptions } from '../types.js' */

/**
 * Main function to handle transcription using Whisper Docker.
 * @param {string} finalPath - The base path for the files.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisperDocker(finalPath, options) {
  try {
    const whisperModel = options.whisperModel || 'base'
    
    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    const modelName = WHISPER_MODELS[whisperModel]
    const downloadModelName = whisperModel === 'large' ? 'large-v2' : whisperModel

    const CONTAINER_NAME = 'autoshow-whisper-1'
    const modelPathContainer = `/app/models/${modelName}`

    // Ensure container is running
    await execPromise(`docker ps | grep ${CONTAINER_NAME}`)
      .catch(() => execPromise('docker-compose up -d whisper'))

    // Ensure model is downloaded
    await execPromise(`docker exec ${CONTAINER_NAME} test -f ${modelPathContainer}`)
      .catch(() => execPromise(`docker exec ${CONTAINER_NAME} /app/models/download-ggml-model.sh ${downloadModelName}`))

    // Run transcription
    const fileName = basename(finalPath)
    await execPromise(
      `docker exec ${CONTAINER_NAME} /app/main -m ${modelPathContainer} -f ${join(`/app/content`, `${fileName}.wav`)} -of ${join(`/app/content`, fileName)} --output-lrc`
    )
    console.log(`  - Transcript LRC file completed at ${finalPath}.lrc`)

    // Process transcript
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = lrcContent.split('\n')
      .filter(line => !line.startsWith('[by:whisper.cpp]'))
      .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
      .join('\n')

    await writeFile(`${finalPath}.txt`, txtContent)
    console.log(`  - Transcript transformation completed at ${finalPath}.txt`)
    
    return txtContent
  } catch (error) {
    console.error('Error in callWhisperDocker:', error)
    process.exit(1)
  }
}