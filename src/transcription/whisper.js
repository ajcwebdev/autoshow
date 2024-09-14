// src/transcription/whisper.js

import { readFile, writeFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import path from 'node:path'

const execPromise = promisify(exec)

const WHISPER_MODELS = {
  'tiny': 'ggml-tiny.bin', 'tiny.en': 'ggml-tiny.en.bin',
  'base': 'ggml-base.bin', 'base.en': 'ggml-base.en.bin',
  'small': 'ggml-small.bin', 'small.en': 'ggml-small.en.bin',
  'medium': 'ggml-medium.bin', 'medium.en': 'ggml-medium.en.bin',
  'large-v1': 'ggml-large-v1.bin', 'large-v2': 'ggml-large-v2.bin',
  'large': 'ggml-large-v2.bin',
}

export async function callWhisper(finalPath, transcriptionService, options) {
  const whisperModel = options.whisper || options.whisperDocker || 'base'
  if (!(whisperModel in WHISPER_MODELS)) throw new Error(`Unknown model type: ${whisperModel}`)
  const modelName = WHISPER_MODELS[whisperModel]
  await (transcriptionService === 'whisper-docker' ? callWhisperDocker : callWhisperMain)(finalPath, modelName, whisperModel)
  const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
  const txtContent = lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
    .join('\n')
  await writeFile(`${finalPath}.txt`, txtContent)
  console.log(`Transcript transformation completed:\n  - ${finalPath}.txt`)
  return txtContent
}

async function callWhisperDocker(finalPath, modelName, whisperModel) {
  const WHISPER_CONTAINER_NAME = 'autoshow-whisper-1'
  const CONTENT_DIR = '/app/content'
  const MODELS_DIR = '/app/models'
  const modelPathHost = `./whisper.cpp/models/${modelName}`
  if (!existsSync(modelPathHost)) {
    console.log(`Model ${modelName} not found locally. Downloading...`)
    await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
    console.log(`Model ${modelName} downloaded.`)
  }
  try {
    await execPromise(`docker ps | grep ${WHISPER_CONTAINER_NAME}`)
    console.log('Whisper container is already running.')
  } catch {
    console.log('Whisper container is not running. Starting it...')
    await execPromise('docker-compose up -d whisper')
    console.log('Whisper container started successfully.')
  }
  const fileName = path.basename(finalPath)
  await execPromise(
    `docker exec ${WHISPER_CONTAINER_NAME} /app/main -m ${path.join(MODELS_DIR, modelName)} -f ${path.join(CONTENT_DIR, `${fileName}.wav`)} -of ${path.join(CONTENT_DIR, fileName)} --output-lrc`
  )
  console.log(`Transcript LRC file completed:\n  - ${finalPath}.lrc`)
}

async function callWhisperMain(finalPath, modelName, whisperModel) {
  const modelPath = `./whisper.cpp/models/${modelName}`
  try {
    await access(modelPath)
    console.log(`Whisper model found: ${modelName}`)
  } catch {
    console.log(`Whisper model not found: ${modelName}. Downloading model: ${whisperModel}`)
    await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
    console.log(`Model downloaded: ${modelName}`)
  }
  await execPromise(
    `./whisper.cpp/main -m "whisper.cpp/models/${modelName}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`
  )
  console.log(`Whisper.cpp Model Selected:\n  - whisper.cpp/models/${modelName}\nTranscript LRC file completed:\n  - ${finalPath}.lrc`)
}