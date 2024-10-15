// src/transcription/whisperDiarization.ts

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
// import { existsSync } from 'node:fs'
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
export async function callWhisperDiarization(options: ProcessingOptions, finalPath: string): Promise<string> {
  log(wait('\n  Using openai-whisper Python library for transcription...'))

  try {
    // Get the whisper model from options or use 'base' as default
    let whisperModel: string = 'base'
    if (typeof options.whisperDiarization === 'string') {
      whisperModel = options.whisperDiarization
    } else if (options.whisperDiarization !== true) {
      throw new Error('Invalid whisperPython option')
    }

    if (!(whisperModel in WHISPER_PYTHON_MODELS)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    log(wait(`\n    - whisperModel: ${whisperModel}`))

    // // Check if ffmpeg is installed
    // try {
    //   await execPromise('ffmpeg -version')
    // } catch (error) {
    //   throw new Error('ffmpeg is not installed or not available in PATH')
    // }

    // // Check if Python is installed
    // try {
    //   await execPromise('python3 --version')
    // } catch (error) {
    //   throw new Error('Python is not installed or not available in PATH')
    // }

    // // Check if the whisper-diarization repo is cloned
    // if (!existsSync('./whisper-diarization')) {
    //   log(`\n  No whisper-diarization repo found, running git clone...\n`)
    //   await execPromise('git clone https://github.com/MahmoudAshraf97/whisper-diarization.git')
    //   log(`\n    - whisper-diarization clone complete.\n`)
    // }

    // Prepare the command to run the transcription
    const command = `python whisper-diarization/diarize.py -a ${finalPath}.wav --whisper-model ${whisperModel}`

    log(wait(`\n  Running transcription with command:\n    ${command}\n`))

    // Execute the command
    await execPromise(command)

    await unlink(`${finalPath}.txt`)
    log(wait(`\n  Extra TXT file deleted:\n    - ${finalPath}.txt\n`))

    // Read the generated transcript file
    const transcriptContent = await readFile(`${finalPath}.srt`, 'utf8')

    // Write the transcript to the expected output file
    await writeFile(`${finalPath}.txt`, transcriptContent)

    // Create an empty LRC file to prevent cleanup errors and unlink SRT file
    await writeFile(`${finalPath}.lrc`, '')
    log(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))
    await unlink(`${finalPath}.srt`)
    log(wait(`\n  SRT file deleted:\n    - ${finalPath}.srt\n`))

    log(wait(`\n  Transcript successfully completed:\n    - ${finalPath}.txt\n`))

    return transcriptContent

  } catch (error) {
    console.error('Error in callWhisperDiarization:', (error as Error).message)
    process.exit(1)
  }
}
