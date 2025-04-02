// src/process-steps/02-download-audio.ts

import { fileTypeFromBuffer } from 'file-type'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execPromise, readFile, access, rename, execFilePromise, unlink } from '../utils/node-utils.ts'

import type { ProcessingOptions } from '../../shared/types.ts'

/**
 * Removes temporary files generated during content processing.
 * Attempts to delete files with specific extensions and logs the results.
 * Silently ignores attempts to delete non-existent files.
 * 
 * Files cleaned up include:
 * - .wav: Audio files
 * 
 * @param {string} id - Base filename (without extension) used to identify related files.
 * @param {boolean} [ensureFolders] - If true, skip deletion to allow creation or preservation of metadata folders.
 * 
 * @returns {Promise<void>} Resolves when cleanup is complete.
 * 
 * @throws {Error} If deletion fails for reasons other than file not existing:
 *   - Permission denied
 *   - File is locked/in use
 *   - I/O errors
 * 
 * @example
 * try {
 *   await saveAudio('content/my-video-2024-03-21')
 *   // Will attempt to delete:
 *   // - content/my-video-2024-03-21.wav
 * } catch (error) {
 *   err('Cleanup failed:', error)
 * }
 */
export async function saveAudio(id: string, ensureFolders?: boolean) {
  if (ensureFolders) {
    l.dim('\nSkipping cleanup to preserve or ensure metadata directories.\n')
    return
  }

  const extensions = ['.wav']
  l.dim(`  Temporary files deleted:`)

  for (const ext of extensions) {
    try {
      await unlink(`${id}${ext}`)
      l.dim(`    - ${id}${ext}`)
    } catch (error) {
      if (error instanceof Error && (error as Error).message !== 'ENOENT') {
        err(`Error deleting file ${id}${ext}: ${(error as Error).message}`)
      }
    }
  }
}

/**
 * Executes a command with retry logic to recover from transient failures.
 * 
 * Does an exponential backoff with 7 total attempts, starting at 1 second for the first attempt.
 * 
 * @param {string} command - The command to execute.
 * @param {string[]} args - Arguments for the command.
 * @returns {Promise<void>} Resolves if the command succeeds.
 * @throws {Error} If the command fails after all retry attempts.
 */
export async function executeWithRetry(
  command: string,
  args: string[],
) {
  const maxRetries = 7

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to execute the command
      const { stderr } = await execFilePromise(command, args)
      // Log any warnings from yt-dlp
      if (stderr) {
        err(`yt-dlp warnings: ${stderr}`)
      }
      return
    } catch (error) {
      // If the last attempt fails, throw the error
      if (attempt === maxRetries) {
        err(`Failed after ${maxRetries} attempts`)
        throw error
      }

      // Exponential backoff: Wait before trying again
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(
        `Retry ${attempt} of ${maxRetries} failed. Waiting ${delayMs} ms before next attempt...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

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
 * Additionally, yt-dlp command execution includes retry logic to recover
 * from transient errors like HTTP 500 responses.
 * 
 * @param {ProcessingOptions} options - Processing configuration containing:
 *   - video: Flag for YouTube video processing
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
) {
  l.step(`\nStep 2 - Download Audio\n`)
  logInitialFunctionCall('downloadAudio', { options, input, filename })

  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`

  // Edge case fix: If a WAV file already exists with the same name, rename it to avoid a hang during conversion
  try {
    await access(outputPath)
    const renamedPath = `${finalPath}-renamed.wav`
    await rename(outputPath, renamedPath)
    l.dim(`    - Existing file found at ${outputPath}. Renamed to ${renamedPath}`)
  } catch {
    // If we reach here, the file doesn't exist. Proceed as normal.
  }

  if (options.video) {
    try {
      await executeWithRetry(
        'yt-dlp',
        [
          '--no-warnings',
          '--restrict-filenames',
          '--extract-audio',
          '--audio-format', 'wav',
          '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
          '--no-playlist',
          '-o', outputPath,
          input,
        ]
      )
    } catch (error) {
      err(`Error downloading audio: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  } else if (options.file) {
    const supportedFormats = new Set([
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm',
    ])
    try {
      await access(input)
      l.dim(`\n  File ${input} is accessible. Attempting to read file data for type detection...\n`)
      const buffer = await readFile(input)
      l.dim(`    - Successfully read file: ${buffer.length} bytes`)
      const fileType = await fileTypeFromBuffer(buffer)
      l.dim(`    - File type detection result: ${fileType?.ext ?? 'unknown'}`)
      if (!fileType || !supportedFormats.has(fileType.ext)) {
        throw new Error(
          fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
        )
      }
      l.dim(`    - Running ffmpeg command for ${input} -> ${outputPath}\n`)
      await execPromise(
        `ffmpeg -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`,
        { maxBuffer: 10000 * 1024 }
      )
      l.dim(`  File converted to WAV format successfully:\n    - ${outputPath}`)
    } catch (error) {
      err(`Error processing local file: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  } else {
    throw new Error('Invalid option provided for audio download/processing.')
  }
  l.dim(`\n  downloadAudio returning:\n    - outputPath: ${outputPath}\n`)
  return outputPath
}