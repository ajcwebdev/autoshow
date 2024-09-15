// src/utils/downloadAudio.js

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'

const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

// Function to download audio from a URL
export async function downloadAudio(url, filename) {
  try {
    // Set the final path for the downloaded file
    const finalPath = `content/${filename}`
    
    // Execute yt-dlp to download the audio
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--restrict-filenames',
      '--extract-audio',
      '--audio-format', 'wav',
      '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
      '--no-playlist',
      '-o', `${finalPath}.%(ext)s`,
      url
    ])
    
    // Log any errors from yt-dlp
    if (stderr) console.error('yt-dlp errors:', stderr)
    
    // Construct the path of the downloaded file
    const downloadedFile = `${finalPath}.wav`
    console.log(`WAV file downloaded:\n  - ${downloadedFile}`)
    return downloadedFile
  } catch (error) {
    console.error('Error during audio download:', error)
    throw error
  }
}

// Function to process a local audio file
export async function downloadFileAudio(filePath) {
  // Define supported audio and video formats
  const supportedFormats = new Set([
    'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'
  ])
  try {
    // Check if the file exists
    await access(filePath)
    
    // Read the file into a buffer
    const buffer = await readFile(filePath)
    console.log(`File read successfully. Buffer length: ${buffer.length}\nDetermining file type...`)
    
    // Determine the file type
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !supportedFormats.has(fileType.ext)) {
      throw new Error(fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type')
    }
    console.log(`Detected file type: ${fileType.ext}`)
    
    // If the file is not already a WAV, convert it
    if (fileType.ext !== 'wav') {
      await execPromise(
        `${ffmpeg} -i "${filePath}" -acodec pcm_s16le -ar 16000 -ac 1 "${filePath}.wav"`
      )
      console.log(`Converted ${filePath} to ${filePath}.wav`)
    } else {
      // If it's already a WAV, just copy it
      await execPromise(`cp "${filePath}" "${filePath}.wav"`)
    }
    return filePath
  } catch (error) {
    console.error('Error in downloadFileAudio:', error.message)
    throw error
  }
}