// src/transcription/whisper.js

import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execPromise = promisify(exec)

function getWhisperModel(modelType) {
  switch (modelType) {
    case 'tiny':
      return "ggml-tiny.bin"
    case 'tiny.en':
      return "ggml-tiny.en.bin"
    case 'base':
      return "ggml-base.bin"
    case 'base.en':
      return "ggml-base.en.bin"
    case 'small':
      return "ggml-small.bin"
    case 'small.en':
      return "ggml-small.en.bin"
    case 'medium':
      return "ggml-medium.bin"
    case 'medium.en':
      return "ggml-medium.en.bin"
    case 'large-v1':
      return "ggml-large-v1.bin"
    case 'large-v2':
      return "ggml-large-v2.bin"
    case 'large':
      return "ggml-large-v2.bin"
    default:
      console.error(`Unknown model type: ${modelType}`)
      process.exit(1)
  }
}

export async function callWhisper(finalPath, whisperModelType) {
  try {
    const whisperModel = getWhisperModel(whisperModelType)
    await execPromise(`./whisper.cpp/main \
      -m "whisper.cpp/models/${whisperModel}" \
      -f "${finalPath}.wav" \
      -of "${finalPath}" \
      --output-lrc`
    )
    console.log(`Whisper.cpp Model Selected:\n  - whisper.cpp/models/${whisperModel}`)
    console.log(`Transcript LRC file completed:\n  - ${finalPath}.lrc`)
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')
    const txtContent = lrcContent.split('\n')
      .filter(line => !line.startsWith('[by:whisper.cpp]'))
      .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
      .join('\n')
    await writeFile(`${finalPath}.txt`, txtContent)
    console.log(`Transcript transformation completed:\n  - ${finalPath}.txt`)
    return txtContent
  } catch (error) {
    console.error('Error in callWhisper:', error)
    throw error
  }
}