// src/transcription/whisper.ts

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { log, wait, WHISPER_MODELS } from '../models.js'
import type { ProcessingOptions, WhisperModelType } from '../types.js'

const execPromise = promisify(exec)

/**
 * Main function to handle transcription using Whisper.
 * @param {string} finalPath - The base path for the files.
 * @param {ProcessingOptions} options - Additional processing options.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisper(options: ProcessingOptions, finalPath: string): Promise<string> {
  log(wait('\n  Using Whisper for transcription...'))
  try {
    // Get the whisper model from options or use 'base' as default
    let whisperModel = 'base'
    if (typeof options.whisper === 'string') {
      whisperModel = options.whisper
    } else if (options.whisper !== true) {
      throw new Error('Invalid whisper option')
    }

    if (!(whisperModel in WHISPER_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    // Get the model ggml file name
    const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]

    log(wait(`\n    - whisperModel: ${whisperModel}\n    - modelGGMLName: ${modelGGMLName}`))

    // Setup Whisper
    if (!existsSync('./whisper.cpp')) {
      log(`\n  No whisper.cpp repo found, running git clone and make...\n`)
      await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp && cp .github/whisper.Dockerfile whisper.cpp/Dockerfile')
      log(`\n    - whisper.cpp clone and make commands complete.\n`)
    }

    // Ensure model is downloaded
    if (!existsSync(`./whisper.cpp/models/ggml-${whisperModel}.bin`)) {
      log(wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`))
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
      log(wait('    - Model download completed, running transcription...\n'))
    }

    // Run transcription
    await execPromise(`./whisper.cpp/main -m "whisper.cpp/models/${modelGGMLName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`)
    log(wait(`\n  Transcript LRC file successfully completed...\n    - ${finalPath}.lrc`))

    // Read the generated LRC file
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    // Process and format the LRC content
    const txtContent = lrcContent.split('\n')
      .filter(line => !line.startsWith('[by:whisper.cpp]'))
      .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
      .join('\n')

    // Write the formatted content to a text file
    await writeFile(`${finalPath}.txt`, txtContent)
    log(wait(`  Transcript transformation successfully completed...\n    - ${finalPath}.txt\n`))

    // Return the processed content
    return txtContent
  } catch (error) {
    console.error('Error in callWhisper:', error)
    process.exit(1)
  }
}