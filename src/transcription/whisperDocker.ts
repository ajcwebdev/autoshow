// src/transcription/whisperDocker.ts

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { WHISPER_MODELS } from '../models.js'
import { log, wait } from '../models.js'
import type { ProcessingOptions } from '../types.js'

const execPromise = promisify(exec)

/**
 * Main function to handle transcription using Whisper Docker.
 * @param {string} finalPath - The base path for the files.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisperDocker(options: ProcessingOptions, finalPath: string): Promise<string> {
  log(wait('\n  Using Whisper Docker for transcription...'))
  try {
    // Get the whisper model from options or use 'base' as default
    const whisperModel = options.whisperDocker || 'base'
    
    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    // Get the model ggml file name
    const modelGGMLName = WHISPER_MODELS[whisperModel]
    const CONTAINER_NAME = 'autoshow-whisper-1'
    const modelPathContainer = `/app/models/${modelGGMLName}`
    log(wait(`    - whisperModel: ${whisperModel}`))
    log(wait(`    - modelGGMLName: ${modelGGMLName}`))
    log(wait(`    - CONTAINER_NAME: ${CONTAINER_NAME}`))
    log(wait(`    - modelPathContainer: ${modelPathContainer}`))

    // Ensure container is running
    await execPromise(`docker ps | grep ${CONTAINER_NAME}`)
      .catch(() => execPromise('docker-compose up -d whisper'))

    // Ensure model is downloaded
    await execPromise(`docker exec ${CONTAINER_NAME} test -f ${modelPathContainer}`)
      .catch(() => execPromise(`docker exec ${CONTAINER_NAME} /app/models/download-ggml-model.sh ${whisperModel}`))

    // Run transcription
    await execPromise(
      `docker exec ${CONTAINER_NAME} /app/main -m ${modelPathContainer} -f ${join(`/app`, `${finalPath}.wav`)} -of ${join(`/app`, finalPath)} --output-lrc`
    )
    log(wait(`\n  Transcript LRC file successfully completed...\n    - ${finalPath}.lrc\n`))

    // Process transcript
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = lrcContent.split('\n')
      .filter(line => !line.startsWith('[by:whisper.cpp]'))
      .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
      .join('\n')

    await writeFile(`${finalPath}.txt`, txtContent)
    log(wait(`  Transcript transformation successfully completed...\n    - ${finalPath}.txt\n`))
    
    return txtContent
  } catch (error) {
    console.error('Error in callWhisperDocker:', error)
    process.exit(1)
  }
}