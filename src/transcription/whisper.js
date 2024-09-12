// src/transcription/whisper.js

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import path from 'node:path'

const execPromise = promisify(exec)

const WHISPER_CONTAINER_NAME = 'autoshow-whisper-1'
const CONTENT_DIR = '/app/content'
const MODELS_DIR = '/app/models'

const WHISPER_MODELS = {
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

async function ensureWhisperContainerRunning() {
  try {
    await execPromise(`docker ps | grep ${WHISPER_CONTAINER_NAME}`)
    console.log('Whisper container is already running.')
  } catch (error) {
    console.log('Whisper container is not running. Starting it...')
    await execPromise('docker-compose up -d whisper')
    console.log('Whisper container started successfully.')
  }
}

async function checkFileExistence(filePath, containerPath = null) {
  const exists = existsSync(filePath)
  console.log(`${exists ? 'Found LRC file' : 'LRC file not found'}:\n  - ${filePath}`)
  if (containerPath) {
    try {
      await execPromise(`docker exec ${WHISPER_CONTAINER_NAME} ls -l ${containerPath}`)
      console.log(`File exists in container:\n  - ${containerPath}`)
    } catch (err) {
      console.error(`File not found in container:\n  - ${containerPath}`)
    }
  }
  return exists
}

async function runWhisperCommand(modelName, inputFile, outputFile) {
  const dockerCommand = `docker exec ${WHISPER_CONTAINER_NAME} /app/main \
    -m ${path.join(MODELS_DIR, modelName)} \
    -f ${path.join(CONTENT_DIR, inputFile)} \
    -of ${path.join(CONTENT_DIR, outputFile)} \
    --output-lrc
  `
  console.log(`Executing Docker command:\n\n${dockerCommand}`)
  await execPromise(dockerCommand)
}

async function processLrcFile(lrcFilePath) {
  const lrcContent = await readFile(lrcFilePath, 'utf8')
  return lrcContent
    .split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
    .join('\n')
}

export async function callWhisper(finalPath, whisperModelType) {
  console.log('callWhisper invoked with:')
  console.log({ finalPath, whisperModelType })
  if (!(whisperModelType in WHISPER_MODELS)) {
    throw new Error(`Unknown model type: ${whisperModelType}`)
  }
  await ensureWhisperContainerRunning()
  const modelName = WHISPER_MODELS[whisperModelType]
  console.log(`\nUsing Whisper model:\n  - ${modelName}`)
  const fileName = path.basename(finalPath)
  const wavFilePath = path.join(process.cwd(), 'content', `${fileName}.wav`)
  const containerWavPath = path.join(CONTENT_DIR, `${fileName}.wav`)
  await checkFileExistence(wavFilePath, containerWavPath)
  await runWhisperCommand(modelName, `${fileName}.wav`, fileName)
  const lrcFilePath = `${finalPath}.lrc`
  const lrcFileExists = await checkFileExistence(lrcFilePath)
  if (!lrcFileExists) {
    throw new Error(`LRC file not found after Whisper execution: ${lrcFilePath}`)
  }
  const txtContent = await processLrcFile(lrcFilePath)
  const txtFilePath = `${finalPath}.txt`
  await writeFile(txtFilePath, txtContent)
  console.log(`Transcript transformation completed:\n  - ${txtFilePath}`)
  return txtContent
}