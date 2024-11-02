// src/transcription/whisper.ts

/**
 * @file Handles transcription using various Whisper implementations.
 * Combines multiple Whisper-based transcription methods into a single file.
 * @packageDocumentation
 */

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { l, err, wait, success, WHISPER_MODELS, WHISPER_PYTHON_MODELS, execPromise } from '../globals.js'
import type { ProcessingOptions, WhisperModelType, WhisperTranscriptServices } from '../types.js'

// Updated function signatures for the runner functions
type WhisperRunner = (finalPath: string, whisperModel: string) => Promise<void>

/**
 * Main function to handle transcription using Whisper.
 * @param options - Additional processing options.
 * @param finalPath - The base path for the files.
 * @param transcriptServices - The Whisper transcription service to use.
 * @returns Returns the formatted transcript content.
 * @throws If an error occurs during transcription.
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices: WhisperTranscriptServices
): Promise<string> {
  l(wait(`\n  Using ${transcriptServices} for transcription...`))
  
  try {
    // Configuration object mapping each service to its specific settings
    const serviceConfig = {
      whisper: {
        option: options.whisper,
        modelList: WHISPER_MODELS,
        runner: runWhisperCpp
      },
      whisperDocker: {
        option: options.whisperDocker,
        modelList: WHISPER_MODELS,
        runner: runWhisperDocker
      },
      whisperPython: {
        option: options.whisperPython,
        modelList: WHISPER_PYTHON_MODELS,
        runner: runWhisperPython
      },
      whisperDiarization: {
        option: options.whisperDiarization,
        modelList: WHISPER_PYTHON_MODELS,
        runner: runWhisperDiarization
      }
    } as const

    // Retrieve the configuration for the specified service
    const config = serviceConfig[transcriptServices]
    
    // Determine the model based on the option type
    const whisperModel = typeof config.option === 'string' 
      ? config.option
      : config.option === true 
        ? 'base'
        : (() => { throw new Error(`Invalid ${transcriptServices} option`) })()

    // Validate the model
    if (!(whisperModel in config.modelList)) {
      throw new Error(`Unknown model type: ${whisperModel}`)
    }

    l(wait(`\n    - whisperModel: ${whisperModel}`))
    
    // Run the appropriate transcription method
    await config.runner(finalPath, whisperModel)

    // Read the generated transcript file (assuming it's always `${finalPath}.txt`)
    const txtContent = await readFile(`${finalPath}.txt`, 'utf8')
    return txtContent
  } catch (error) {
    err(`Error in callWhisper with ${transcriptServices}:`, (error as Error).message)
    process.exit(1)
  }
}

// Helper functions for each transcription method

/**
 * Transcribes audio using the local Whisper.cpp implementation.
 * @param options - Processing options.
 * @param finalPath - Base path for files.
 * @param whisperModel - The Whisper model to use.
 */
const runWhisperCpp: WhisperRunner = async (finalPath, whisperModel) => {
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  l(wait(`    - modelGGMLName: ${modelGGMLName}`))

  // Setup Whisper.cpp if not already present
  if (!existsSync('./whisper.cpp')) {
    l(wait(`\n  No whisper.cpp repo found, cloning and compiling...\n`))
    await execPromise('git clone https://github.com/ggerganov/whisper.cpp.git && make -C whisper.cpp')
    l(wait(`\n    - whisper.cpp clone and compilation complete.\n`))
  }

  // Ensure the model is downloaded
  if (!existsSync(`./whisper.cpp/models/${modelGGMLName}`)) {
    l(wait(`\n  Model not found, downloading...\n    - ${whisperModel}\n`))
    await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
    l(wait('    - Model download completed, running transcription...\n'))
  }

  // Run transcription
  await execPromise(`./whisper.cpp/main -m "whisper.cpp/models/${modelGGMLName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`)
  l(success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`))

  // Process the LRC file into a TXT file
  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l(success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`))
}

/**
 * Transcribes audio using Whisper.cpp inside a Docker container.
 * @param options - Processing options.
 * @param finalPath - Base path for files.
 * @param whisperModel - The Whisper model to use.
 */
const runWhisperDocker: WhisperRunner = async (finalPath, whisperModel) => {
  const modelGGMLName = WHISPER_MODELS[whisperModel as WhisperModelType]
  const CONTAINER_NAME = 'autoshow-whisper-1'
  const modelPathContainer = `/app/models/${modelGGMLName}`

  l(wait(`    - modelGGMLName: ${modelGGMLName}`))
  l(wait(`    - CONTAINER_NAME: ${CONTAINER_NAME}`))
  l(wait(`    - modelPathContainer: ${modelPathContainer}`))

  // Ensure the Docker container is running
  await execPromise(`docker ps | grep ${CONTAINER_NAME}`)
    .catch(() => execPromise('docker-compose up -d whisper'))

  // Ensure the model is downloaded inside the container
  await execPromise(`docker exec ${CONTAINER_NAME} test -f ${modelPathContainer}`)
    .catch(() => execPromise(`docker exec ${CONTAINER_NAME} /app/models/download-ggml-model.sh ${whisperModel}`))

  // Run transcription inside the container
  await execPromise(
    `docker exec ${CONTAINER_NAME} /app/main -m ${modelPathContainer} -f "/app/${finalPath}.wav" -of "/app/${finalPath}" --output-lrc`
  )
  l(success(`\n  Transcript LRC file successfully created:\n    - ${finalPath}.lrc`))

  // Process the LRC file into a TXT file
  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcToTxt(lrcContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l(success(`  Transcript transformation successfully completed:\n    - ${finalPath}.txt`))
}

/**
 * Transcribes audio using the openai-whisper Python library.
 * @param options - Processing options.
 * @param finalPath - Base path for files.
 * @param whisperModel - The Whisper model to use.
 */
const runWhisperPython: WhisperRunner = async (finalPath, whisperModel) => {
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
    await execPromise('which whisper')
  } catch (error) {
    l(wait('\n  openai-whisper not found, installing...'))
    await execPromise('pip install -U openai-whisper')
    l(wait('    - openai-whisper installed'))
  }

  // Prepare the command to run the transcription
  const command = `whisper "${finalPath}.wav" --model ${whisperModel} --output_dir "content" --output_format srt --language en --word_timestamps True`

  l(wait(`\n  Running transcription with command:\n    ${command}\n`))

  // Execute the command
  await execPromise(command)

  // Process the SRT file into a TXT file
  const srtContent = await readFile(`${finalPath}.srt`, 'utf8')
  const txtContent = srtToTxt(srtContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l(wait(`\n  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`))

  // Create an empty LRC file to prevent cleanup errors and unlink SRT file
  await writeFile(`${finalPath}.lrc`, '')
  l(wait(`\n  Empty LRC file created:\n    - ${finalPath}.lrc\n`))
  await unlink(`${finalPath}.srt`)
  l(wait(`\n  SRT file deleted:\n    - ${finalPath}.srt\n`))
}

/**
 * Transcribes audio using Whisper with speaker diarization.
 * @param options - Processing options.
 * @param finalPath - Base path for files.
 * @param whisperModel - The Whisper model to use.
 */
const runWhisperDiarization: WhisperRunner = async (finalPath, whisperModel) => {
  // Check if the virtual environment exists
  const venvPythonPath = 'whisper-diarization/venv/bin/python'
  if (!existsSync(venvPythonPath)) {
    l(wait(`\n  Virtual environment not found, running setup script...\n`))
    await execPromise('bash scripts/setup-python.sh')
    l(wait(`    - whisper-diarization setup complete.\n`))
  }

  // Prepare the command to run the transcription
  const command = `${venvPythonPath} whisper-diarization/diarize.py -a ${finalPath}.wav --whisper-model ${whisperModel}`
  l(wait(`\n  Running transcription with command:\n    ${command}\n`))

  // Execute the command
  await execPromise(command)
  await unlink(`${finalPath}.txt`)

  // Process the SRT file into a TXT file
  const srtContent = await readFile(`${finalPath}.srt`, 'utf8')
  const txtContent = srtToTxt(srtContent)
  await writeFile(`${finalPath}.txt`, txtContent)
  l(wait(`\n  Transcript transformation successfully completed:\n    - ${finalPath}.txt\n`))

  // Create an empty LRC file to prevent cleanup errors and unlink SRT file
  await writeFile(`${finalPath}.lrc`, '')
  l(success(`  Empty LRC file created:\n    - ${finalPath}.lrc`))
  await unlink(`${finalPath}.srt`)
  l(success(`  SRT file deleted:\n    - ${finalPath}.srt`))
}

// Helper functions for processing transcript files

/**
 * Converts LRC content to plain text with timestamps.
 * @param lrcContent - The content of the LRC file.
 * @returns The converted text content.
 */
function lrcToTxt(lrcContent: string): string {
  return lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
    .join('\n')
}

/**
 * Converts SRT content to plain text with timestamps.
 * @param srtContent - The content of the SRT file.
 * @returns The converted text content.
 */
function srtToTxt(srtContent: string): string {
  const blocks = srtContent.split('\n\n')
  return blocks
    .map(block => {
      const lines = block.split('\n').filter(line => line.trim() !== '')
      if (lines.length < 2) return null

      const timestampLine = lines[1]
      const textLines = lines.slice(2)
      
      const match = timestampLine?.match(/(\d{2}):(\d{2}):(\d{2}),\d{3}/)
      if (!match?.[1] || !match?.[2] || !match?.[3]) return null

      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const seconds = match[3]
      const totalMinutes = hours * 60 + minutes
      const timestamp = `[${String(totalMinutes).padStart(2, '0')}:${seconds}]`
      const text = textLines.join(' ')
      
      return `${timestamp} ${text}`
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}
