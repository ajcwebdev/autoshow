// src/transcription/whisperPython.ts

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { log, wait, WHISPER_PYTHON_MODELS } from '../models.js'
import type { ProcessingOptions } from '../types.js'

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
    const command = `whisper "${finalPath}.wav" --model ${whisperModel} --output_dir "content" --output_format srt --language en --word_timestamps True`

    log(wait(`\n  Running transcription with command:\n    ${command}\n`))

    // Execute the command
    await execPromise(command)

    // Read the generated transcript file
    const srtContent = await readFile(`${finalPath}.srt`, 'utf8')
    
    // Process and format the SRT content
    const blocks = srtContent.split('\n\n')
    
    const txtContent = blocks
      .map(block => {
        const lines = block.split('\n').filter(line => line.trim() !== '')
        if (lines.length >= 2) {
          // lines[0] is the sequence number
          // lines[1] is the timestamp line
          // lines[2...] are the subtitle text lines
          const timestampLine = lines[1]
          const textLines = lines.slice(2)
          const match = timestampLine.match(/(\d{2}):(\d{2}):(\d{2}),\d{3}/)
          if (match) {
            const hours = parseInt(match[1], 10)
            const minutes = parseInt(match[2], 10)
            const seconds = match[3]
            const totalMinutes = hours * 60 + minutes
            const timestamp = `[${String(totalMinutes).padStart(2, '0')}:${seconds}]`
            const text = textLines.join(' ')
            return `${timestamp} ${text}`
          }
        }
        return null
      })
      .filter(line => line !== null)
      .join('\n')
    
    // Write the formatted content to a text file
    await writeFile(`${finalPath}.txt`, txtContent)
    log(wait(`\n  Transcript transformation successfully completed...\n    - ${finalPath}.txt\n`))
    
    // Create an empty LRC file to prevent cleanup errors and unlink SRT file
    await writeFile(`${finalPath}.lrc`, '')
    log(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))
    await unlink(`${finalPath}.srt`)
    log(wait(`\n  SRT file deleted:\n    - ${finalPath}.srt\n`))
    
    // Return the processed content
    return txtContent

  } catch (error) {
    console.error('Error in callWhisperPython:', (error as Error).message)
    process.exit(1)
  }
}
