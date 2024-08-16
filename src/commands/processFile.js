// src/commands/processFile.js

import { readFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'
import { runTranscription, runLLM, cleanUpFiles } from '../utils/exports.js'

const execPromise = promisify(exec)

async function convertFile(filePath) {
  try {
    const buffer = await readFile(filePath)
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType) {
      throw new Error('Unable to determine file type')
    }
    console.log(`Detected file type: ${fileType.ext}`)

    const formats = ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm']
    if (!formats.includes(fileType.ext)) {
      throw new Error(`Unsupported file type: ${fileType.ext}`)
    }

    if (fileType.ext !== 'wav') {
      try {
        await execPromise(`${ffmpeg} -i "${filePath}" -acodec pcm_s16le -ar 16000 -ac 1 "${filePath}.wav"`)
        console.log(`Converted ${filePath} to ${filePath}.wav`)
      } catch (error) {
        console.error('Error converting file:', error)
        throw error
      }
    } else {
      await execPromise(`cp "${filePath}" "${filePath}.wav"`)
    }
    return filePath
  } catch (error) {
    console.error('Error in convertFile:', error)
    throw error
  }
}

export async function processFile(filePath, llmOption, whisperModelType) {
  try {
    const finalPath = await convertFile(filePath)
    const frontMatter = `---
title: "${filePath}"
---\n`
    await runTranscription(finalPath, whisperModelType, frontMatter)
    await runLLM(finalPath, frontMatter, llmOption)
    await cleanUpFiles(finalPath)
    console.log('File processing completed')
  } catch (error) {
    console.error('Error processing file:', error)
    throw error
  }
}