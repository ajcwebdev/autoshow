// src/commands/processFile.js

import { readFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { basename } from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'
import { runTranscription } from '../utils/runTranscription.js'
import { runLLM } from '../utils/runLLM.js'
import { cleanUpFiles } from '../utils/cleanUpFiles.js'

const execPromise = promisify(exec)

async function downloadFileAudio(filePath) {
  const supportedFormats = new Set(['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'])
  try {
    await access(filePath)
    const buffer = await readFile(filePath)
    console.log(`File read successfully. Buffer length: ${buffer.length}\nDetermining file type...`)
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !supportedFormats.has(fileType.ext)) {
      throw new Error(fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type')
    }
    console.log(`Detected file type: ${fileType.ext}`)
    if (fileType.ext !== 'wav') {
      await execPromise(`${ffmpeg} -i "${filePath}" -acodec pcm_s16le -ar 16000 -ac 1 "${filePath}.wav"`)
      console.log(`Converted ${filePath} to ${filePath}.wav`)
    } else {
      await execPromise(`cp "${filePath}" "${filePath}.wav"`)
    }
    return filePath
  } catch (error) {
    console.error('Error in downloadFileAudio:', error.message)
    throw error
  }
}

export async function processFile(filePath, llmOption, transcriptionOption, options) {
  try {
    const finalPath = await downloadFileAudio(filePath)
    const frontMatter = `---\ntitle: "${basename(filePath)}"\n---\n`
    await runTranscription(finalPath, transcriptionOption, options, frontMatter)
    await runLLM(finalPath, frontMatter, llmOption, options)
    await cleanUpFiles(finalPath)
    console.log('File processing completed')
  } catch (error) {
    console.error('Error processing file:', error)
    throw error
  }
}