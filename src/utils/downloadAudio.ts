// src/utils/downloadAudio.ts

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import ffmpeg from 'ffmpeg-static'
import { checkDependencies } from './checkDependencies.js'
import { log, step, success, wait } from '../models.js'
import type { SupportedFileType, ProcessingOptions } from '../types.js'

const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

/**
 * Function to download or process audio based on the input type.
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 * @param {string} input - The URL of the video or path to the local file.
 * @param {string} filename - The base filename to save the audio as.
 * @returns {Promise<string>} - Returns the path to the downloaded or processed WAV file.
 * @throws {Error} - If there is an error during the download or processing.
 */
export async function downloadAudio(options: ProcessingOptions, input: string, filename: string): Promise<string> {
  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`

  if (options.video || options.playlist || options.urls || options.rss) {
    log(step('\nStep 2 - Downloading URL audio...\n'))
    try {
      // Check for required dependencies
      await checkDependencies(['yt-dlp'])

      // Execute yt-dlp to download the audio
      const { stderr } = await execFilePromise('yt-dlp', [
        '--no-warnings',
        '--restrict-filenames',
        '--extract-audio',
        '--audio-format', 'wav',
        '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
        '--no-playlist',
        '-o', outputPath,
        input,
      ])

      // Log any errors from yt-dlp
      if (stderr) {
        console.error(`yt-dlp warnings: ${stderr}`)
      }

      log(success(`  Audio downloaded successfully:\n    - ${outputPath}`))
    } catch (error) {
      console.error(`Error downloading audio: ${error instanceof Error ? (error as Error).message : String(error)}`)
      throw error
    }
  } else if (options.file) {
    log(step('\nStep 2 - Processing file audio...\n'))
    // Define supported audio and video formats
    const supportedFormats: Set<SupportedFileType> = new Set([
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm',
    ])
    try {
      // Check if the file exists
      await access(input)

      // Read the file into a buffer
      const buffer = await readFile(input)

      // Determine the file type
      const fileType = await fileTypeFromBuffer(buffer)
      if (!fileType || !supportedFormats.has(fileType.ext as SupportedFileType)) {
        throw new Error(
          fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
        )
      }
      log(wait(`  File type detected as ${fileType.ext}, converting to WAV...\n`))

      // Convert the file to WAV format
      await execPromise(
        `${ffmpeg} -y -i "${input}" -ar 16000 -ac 1 -vn "${outputPath}"`
      )
      log(success(`  File converted to WAV format successfully:\n    - ${outputPath}`))
    } catch (error) {
      console.error(`Error processing local file: ${error instanceof Error ? (error as Error).message : String(error)}`)
      throw error
    }
  } else {
    throw new Error('Invalid option provided for audio download/processing.')
  }

  return outputPath
}