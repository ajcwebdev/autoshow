// src/utils/downloadAudio.js

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

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