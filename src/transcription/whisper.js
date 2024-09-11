// src/transcription/whisper.js

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'

const execPromise = promisify(exec)

async function ensureWhisperContainerRunning() {
  try {
    await execPromise('docker ps | grep autoshow-whisper-1')
    console.log('Whisper container is already running.')
  } catch (error) {
    console.log('Whisper container is not running. Starting it...')
    try {
      await execPromise('docker-compose up -d whisper')
      console.log('Whisper container started successfully.')
    } catch (startError) {
      console.error('Failed to start Whisper container:', startError)
      throw startError
    }
  }
}

export async function callWhisper(finalPath, whisperModelType) {
  try {
    console.log(`\ncallWhisper invoked with:\n`)
    console.log({finalPath,whisperModelType})

    await ensureWhisperContainerRunning()

    // Model map
    const models = {
      'tiny': 'ggml-tiny.bin',
      'tiny.en': 'ggml-tiny.en.bin',
      'base': 'ggml-base.bin',
      'base.en': 'ggml-base.en.bin',
      'small': 'ggml-small.bin',
      'small.en': 'ggml-small.en.bin',
      'medium': 'ggml-medium.bin',
      'medium.en': 'ggml-medium.en.bin',
      'large-v1': 'ggml-large-v1.bin',
      'large-v2': 'ggml-large-v2.bin',
      'large': 'ggml-large-v2.bin',
    }

    // Check for valid model
    if (!(whisperModelType in models)) {
      console.error(`Unknown model type: ${whisperModelType}`)
      process.exit(1)
    }

    const modelName = models[whisperModelType]
    console.log(`\nUsing Whisper model:\n  - ${modelName}`)

    // Check if WAV file exists in the host system
    const wavFilePath = `${process.cwd()}/content/${finalPath.split('/').pop()}.wav`
    const wavFileExists = existsSync(wavFilePath)

    if (!wavFileExists) {
      console.error(`WAV file not found in host system: ${wavFilePath}`)
    } else {
      console.log(`\nWAV file exists in host system:\n  - ${wavFilePath}`)
    }
    // Attempt to list files in the Whisper container's workspace to ensure it's mounted correctly
    console.log('\nChecking if WAV file exists inside the Whisper container...')
    try {
      // Capture the output of `ls` inside the container's workspace
      const { stdout: lsStdout } = await execPromise(`docker exec autoshow-whisper-1 ls -l /app/content`)
      console.log('Files inside Whisper container at /app/content:', lsStdout)
    } catch (err) {
      console.error('Error listing files inside Whisper container:', err.message)
    }
    // Prepare docker command for running Whisper
    const dockerCommand = `docker exec autoshow-whisper-1 /app/main \
      -m /app/models/${modelName} \
      -f /app/content/${finalPath.split('/').pop()}.wav \
      -of /app/content/${finalPath.split('/').pop()} \
      --output-lrc
    `
    console.log(`\nDocker command constructed:\n  - ${dockerCommand}`)
    console.log(`\nCurrent working directory:\n  - ${process.cwd()}`)
    console.log(`\nExpected WAV file in host system:\n  - ${wavFilePath}`)
    console.log(`\nExpected WAV file in Whisper container:\n  - /app/content/${finalPath.split('/').pop()}.wav`)

    // Execute docker command
    const { stdout, stderr } = await execPromise(dockerCommand)

    // Log output and errors from the docker command
    if (stdout) {
      console.log('\nWhisper command stdout:', stdout)
    }
    if (stderr) {
      console.log('\nWhisper command stderr:', stderr)
    }
    console.log(`Whisper.cpp Model Selected:\n  - /app/models/${modelName}`)
    console.log(`\nExpected LRC file path:\n  - ${finalPath}.lrc`)

    // Check if the LRC file was created
    const lrcFilePath = `${finalPath}.lrc`
    const lrcFileExists = existsSync(lrcFilePath)

    if (!lrcFileExists) {
      console.error(`LRC file not found after Whisper execution: ${lrcFilePath}`)
    } else {
      console.log(`LRC file exists:\n  - ${lrcFilePath}`)
    }

    // Read and process the LRC file
    const lrcContent = await readFile(lrcFilePath, 'utf8')
    const txtContent = lrcContent
      .split('\n')
      .filter((line) => !line.startsWith('[by:whisper.cpp]'))
      .map((line) =>
        line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (match, p1, p2) => `[${p1}:${p2}]`)
      )
      .join('\n')

    // Write the processed transcript to a TXT file
    const txtFilePath = `${finalPath}.txt`
    await writeFile(txtFilePath, txtContent)
    console.log(`Transcript transformation completed:\n  - ${txtFilePath}`)

    return txtContent
  } catch (error) {
    console.error('Error in callWhisper:', error)
    throw error
  }
}