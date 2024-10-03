// src/utils/downloadAudio.js

import { checkDependencies } from './checkDependencies.js'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'

/** @import { SupportedFileType } from '../types.js' */

const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

/**
 * Function to download audio from a URL using yt-dlp.
 * @param {string} url - The URL of the video to download audio from.
 * @param {string} filename - The base filename to save the audio as.
 * @returns {Promise<string>} - Returns the path to the downloaded WAV file.
 * @throws {Error} - If there is an error during the download process.
 */
export async function downloadAudio(url, filename) {
  try {
    // Check for required dependencies
    await checkDependencies(['yt-dlp'])

    // Set the final path for the downloaded file
    const finalPath = `content/${filename}`
    console.log('\nStep 2 - Downloading audio...')

    // Execute yt-dlp to download the audio
    const { stderr } = await execFilePromise('yt-dlp', [
      '--no-warnings',
      '--restrict-filenames',
      '--extract-audio',
      '--audio-format', 'wav',
      '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
      '--no-playlist',
      '-o', `${finalPath}.%(ext)s`,
      url,
    ])

    // Log any errors from yt-dlp
    if (stderr) {
      console.error(`yt-dlp warnings: ${stderr}`)
    }

    // Construct the path of the downloaded file
    const downloadedFile = `${finalPath}.wav`
    console.log(`  - ${downloadedFile}\n  - Audio downloaded successfully.`)
    return downloadedFile
  } catch (error) {
    console.error(`Error downloading audio: ${error.message}`)
    throw error
  }
}

/**
 * Function to process a local audio or video file.
 * @param {string} filePath - The path to the local file.
 * @param {string} sanitizedFilename - The sanitized filename.
 * @returns {Promise<string>} - Returns the final path to the processed WAV file.
 * @throws {Error} - If the file type is unsupported or processing fails.
 */
export async function downloadFileAudio(filePath, sanitizedFilename) {
  // Define supported audio and video formats
  /** @type {Set<SupportedFileType>} */
  const supportedFormats = new Set([
    'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm',
  ])
  try {
    // Check if the file exists
    await access(filePath)

    // Read the file into a buffer
    const buffer = await readFile(filePath)

    // Determine the file type
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !supportedFormats.has(/** @type {SupportedFileType} */ (fileType.ext))) {
      throw new Error(
        fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
      )
    }
    console.log(`\nStep 2 - File read successfully and type detected as ${fileType.ext}, converting to WAV...`)

    const outputPath = `content/${sanitizedFilename}.wav`

    // Convert the file to WAV format
    await execPromise(
      `${ffmpeg} -i "${filePath}" -ar 16000 -ac 1 -vn "${outputPath}"`
    )
    console.log(`  - ${outputPath}\n  - File converted to WAV format successfully.`)

    return outputPath
  } catch (error) {
    console.error(`Error processing local file: ${error.message}`)
    throw error
  }
}