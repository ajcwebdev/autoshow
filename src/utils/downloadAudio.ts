// src/utils/downloadAudio.ts

/**
 * @file Utility for downloading and processing audio from various sources.
 * Handles both online content (via yt-dlp) and local files (via ffmpeg),
 * converting them to a standardized WAV format suitable for transcription.
 * @packageDocumentation
 */

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, access } from 'node:fs/promises'
import { fileTypeFromBuffer } from 'file-type'
import { l, err, step, success, wait } from '../globals.js'
import type { SupportedFileType, ProcessingOptions } from '../types.js'

// Promisify node:child_process functions for async/await usage
const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

/**
 * Downloads or processes audio content from various sources and converts it to a standardized WAV format.
 * 
 * The function handles two main scenarios:
 * 1. Online content (YouTube, RSS feeds) - Downloads using yt-dlp
 * 2. Local files - Converts using ffmpeg
 * 
 * In both cases, the output is converted to:
 * - WAV format
 * - 16kHz sample rate
 * - Mono channel
 * - 16-bit PCM encoding
 * 
 * @param {ProcessingOptions} options - Processing configuration containing:
 *   - video: Flag for YouTube video processing
 *   - playlist: Flag for YouTube playlist processing
 *   - urls: Flag for processing from URL list
 *   - rss: Flag for RSS feed processing
 *   - file: Flag for local file processing
 * 
 * @param {string} input - The source to process:
 *   - For online content: URL of the content
 *   - For local files: File path on the system
 * 
 * @param {string} filename - Base filename for the output WAV file
 *                           (without extension, will be saved in content/ directory)
 * 
 * @returns {Promise<string>} Path to the processed WAV file
 * 
 * @throws {Error} If:
 *   - Required dependencies (yt-dlp, ffmpeg) are missing
 *   - File access fails
 *   - File type is unsupported
 *   - Conversion process fails
 *   - Invalid options are provided
 * 
 * Supported file formats include:
 * - Audio: wav, mp3, m4a, aac, ogg, flac
 * - Video: mp4, mkv, avi, mov, webm
 * 
 * @example
 * // Download from YouTube
 * const wavPath = await downloadAudio(
 *   { video: true },
 *   'https://www.youtube.com/watch?v=...',
 *   'my-video'
 * )
 * 
 * @example
 * // Process local file
 * const wavPath = await downloadAudio(
 *   { file: true },
 *   '/path/to/audio.mp3',
 *   'my-audio'
 * )
 */
export async function downloadAudio(
  options: ProcessingOptions,
  input: string,
  filename: string
): Promise<string> {
  // Define output paths using the provided filename
  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`

  // Handle online content (YouTube, RSS feeds, etc.)
  if (options.video || options.playlist || options.urls || options.rss) {
    l(step('\nStep 2 - Downloading URL audio...\n'))
    try {
      // Download and convert audio using yt-dlp
      const { stderr } = await execFilePromise('yt-dlp', [
        '--no-warnings',           // Suppress warning messages
        '--restrict-filenames',    // Use safe filenames
        '--extract-audio',         // Extract audio stream
        '--audio-format', 'wav',   // Convert to WAV
        '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1', // 16kHz mono
        '--no-playlist',           // Don't expand playlists
        '-o', outputPath,          // Output path
        input,
      ])
      // Log any non-fatal warnings from yt-dlp
      if (stderr) {
        err(`yt-dlp warnings: ${stderr}`)
      }
      l(success(`  Audio downloaded successfully:\n    - ${outputPath}`))
    } catch (error) {
      err(
        `Error downloading audio: ${
          error instanceof Error ? (error as Error).message : String(error)
        }`
      )
      throw error
    }
  }
  // Handle local file processing
  else if (options.file) {
    l(step('\nStep 2 - Processing file audio...\n'))
    // Define supported media formats
    const supportedFormats: Set<SupportedFileType> = new Set([
      // Audio formats
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac',
      // Video formats
      'mp4', 'mkv', 'avi', 'mov', 'webm',
    ])
    try {
      // Verify file exists and is accessible
      await access(input)
      // Read file and determine its type
      const buffer = await readFile(input)
      const fileType = await fileTypeFromBuffer(buffer)
      // Validate file type is supported
      if (!fileType || !supportedFormats.has(fileType.ext as SupportedFileType)) {
        throw new Error(
          fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
        )
      }
      l(wait(`  File type detected as ${fileType.ext}, converting to WAV...\n`))
      // Convert to standardized WAV format using ffmpeg
      await execPromise(
        `ffmpeg -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`
      )
      l(success(`  File converted to WAV format successfully:\n    - ${outputPath}`))
    } catch (error) {
      err(
        `Error processing local file: ${
          error instanceof Error ? (error as Error).message : String(error)
        }`
      )
      throw error
    }
  }
  // Handle invalid options
  else {
    throw new Error('Invalid option provided for audio download/processing.')
  }
  return outputPath
}