// src/transcription/whisper.ts

/**
 * This file manages transcription using local Whisper.cpp.
 * It provides a streamlined, single-container approach for audio transcription.
 */

import { readFile, unlink } from 'node:fs/promises'
import { checkWhisperDirAndModel, formatWhisperTranscript } from '../utils/step-utils/transcription-utils'
import { WHISPER_MODELS } from '../../shared/constants'
import { spawn } from 'node:child_process'
import { l, err } from '../utils/logging'
import type { ProcessingOptions } from '../utils/types/step-types'
import type { WhisperOutput } from '../utils/types/transcription'

/**
 * Executes a command using spawn and returns a promise that resolves on successful completion.
 * @param {string} command - The executable command to run
 * @param {string[]} args - The list of arguments passed to the command
 * @returns {Promise<void>} - Resolves if the command completes with code 0, rejects otherwise
 */
async function spawnPromise(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let errorData = ''

    child.stderr.on('data', data => {
      errorData += data
    })

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${errorData}`))
      } else {
        resolve()
      }
    })
  })
}

/**
 * Main function to handle transcription using local Whisper.cpp.
 * @param {ProcessingOptions} options - Processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @returns {Promise<string>} - The formatted transcript content as a string.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string
) {
  l.opts('\n  callWhisper called with arguments:')
  l.opts(`    - finalPath: ${finalPath}`)

  try {
    // Determine which model was requested (default to "base" if `--whisper` is passed with no model)
    const whisperModel = typeof options.whisper === 'string'
      ? options.whisper
      : options.whisper === true
        ? 'base'
        : (() => { throw new Error('Invalid whisper option') })()

    // Destructure label and value directly from the found model
    const { label, value } = WHISPER_MODELS.find(m => m.label === whisperModel) ?? 
      (() => { throw new Error(`Unknown model type: ${whisperModel}`) })()

    l.dim(`\n  Whisper model information:\n\n    - whisperModel: ${whisperModel}`)
    l.dim(`    - modelGGMLName: ${value}`)

    await checkWhisperDirAndModel(label, value)

    // Run whisper.cpp on the WAV file
    l.dim(`  Invoking whisper.cpp on file:\n    - ${finalPath}.wav`)
    try {
      await spawnPromise(
        './whisper.cpp/build/bin/whisper-cli',
        [
          '--no-gpu',
          '-m', `whisper.cpp/models/${value}`,
          '-f', `${finalPath}.wav`,
          '-of', `${finalPath}`,
          '-ml', '1',
          '--output-json'
        ]
      )
    } catch (whisperError) {
      err(`Error running whisper.cpp: ${(whisperError as Error).message}`)
      throw whisperError
    }

    l.dim(`\n  Transcript JSON file successfully created, reading file for txt conversion:\n    - ${finalPath}.json\n`)
    const jsonContent = await readFile(`${finalPath}.json`, 'utf8')
    const parsedJson = JSON.parse(jsonContent) as WhisperOutput
    const txtContent = formatWhisperTranscript(parsedJson)
    await unlink(`${finalPath}.json`)

    // Return the transcript text
    return txtContent
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}