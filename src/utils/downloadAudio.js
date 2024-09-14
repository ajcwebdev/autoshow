// src/utils/downloadAudio.js

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'

const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

export async function downloadAudio(url, filename) {
  try {
    const finalPath = `content/${filename}`
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--extract-audio',
      '--audio-format', 'wav',
      '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
      '--no-playlist',
      '-o', `${finalPath}.%(ext)s`,
      url
    ])
    // console.log('yt-dlp output:\n  -', stdout)
    if (stderr) console.error('yt-dlp errors:', stderr)
    const downloadedFile = `${finalPath}.wav`
    console.log(`WAV file downloaded:\n  - ${downloadedFile}`)
    return downloadedFile
  } catch (error) {
    console.error('Error during audio download:', error)
    throw error
  }
}

export async function downloadFileAudio(filePath) {
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