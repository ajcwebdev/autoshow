// src/transcription/whisper.js

import { readFile, writeFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { WHISPER_MODELS } from '../types.js'

const execPromise = promisify(exec)

/** @import { ProcessingOptions } from '../types.js' */

/**
 * Main function to handle transcription using Whisper.
 * @param {string} finalPath - The base path for the files.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisper(finalPath, options) {
  try {
    const whisperModel = options.whisperModel || 'base'
    
    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    const modelName = WHISPER_MODELS[whisperModel]
    const downloadModelName = whisperModel === 'large' ? 'large-v2' : whisperModel
    const modelPath = `./whisper.cpp/models/${modelName}`

    // Setup Whisper
    await access('./whisper.cpp').catch(async () => {
      await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp && cp .github/whisper.Dockerfile whisper.cpp/Dockerfile')
    })

    // Ensure model is downloaded
    await access(modelPath).catch(async () => {
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${downloadModelName}`)
    })

    // Run transcription
    await execPromise(`./whisper.cpp/main -m "whisper.cpp/models/${modelName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`)
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
    console.error('Error in callWhisper:', error)
    process.exit(1)
  }
}