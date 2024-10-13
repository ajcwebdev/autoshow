// src/transcription/whisperPython.ts

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { log, wait } from '../models.js'
import type { ProcessingOptions } from '../types.js'
import { WHISPER_PYTHON_MODELS } from '../models.js'

const execPromise = promisify(exec)

/**
 * Main function to handle transcription using openai-whisper Python library.
 * @param {ProcessingOptions} options - Additional processing options.
 * @param {string} finalPath - The base path for the files.
 * @returns {Promise<string>} - Returns the formatted transcript content.
 * @throws {Error} - If an error occurs during transcription.
 */
export async function callWhisperPython(options: ProcessingOptions, finalPath: string): Promise<string> {
  log(wait('\n  Using openai-whisper Python library for transcription...'))

  try {
    // Get the whisper model from options or use 'base' as default
    let whisperModel: string = 'base'
    if (typeof options.whisperPython === 'string') {
      whisperModel = options.whisperPython
    } else if (options.whisperPython !== true) {
      throw new Error('Invalid whisperPython option')
    }

    if (!(whisperModel in WHISPER_PYTHON_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    log(wait(`\n    - whisperModel: ${whisperModel}`))

    // Check if ffmpeg is installed
    try {
      await execPromise('ffmpeg -version')
    } catch (error) {
      throw new Error('ffmpeg is not installed or not available in PATH')
    }

    // Check if Python is installed
    try {
      await execPromise('python3 --version')
    } catch (error) {
      throw new Error('Python is not installed or not available in PATH')
    }

    // Check if the openai-whisper package is installed
    try {
      // await execPromise('python3 -c "import whisper"')
      await execPromise('which whisper')
    } catch (error) {
      log(wait('\n  openai-whisper not found, installing...'))
      // await execPromise('pip install -U openai-whisper')
      await execPromise('brew install openai-whisper')
      log(wait('    - openai-whisper installed'))
    }

    // Prepare the command to run the transcription
    const command = `whisper "${finalPath}.wav" --model ${whisperModel} --output_dir "content" --output_format vtt --language en --word_timestamps True`

    log(wait(`\n  Running transcription with command:\n    ${command}\n`))

    // Execute the command
    await execPromise(command)

    // Read the generated transcript file
    const transcriptContent = await readFile(`${finalPath}.vtt`, 'utf8')

    // Write the transcript to the expected output file
    await writeFile(`${finalPath}.txt`, transcriptContent)

    // Create an empty LRC file to prevent cleanup errors and unlink VTT file
    await writeFile(`${finalPath}.lrc`, '')
    log(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))
    await unlink(`${finalPath}.vtt`)
    log(wait(`\n  VTT file deleted:\n    - ${finalPath}.vtt\n`))

    log(wait(`\n  Transcript successfully completed:\n    - ${finalPath}.txt\n`))

    return transcriptContent

  } catch (error) {
    console.error('Error in callWhisperPython:', (error as Error).message)
    process.exit(1)
  }
}
