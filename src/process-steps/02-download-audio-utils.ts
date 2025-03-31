// src/process-steps/02-download-audio-utils.ts

import { l, err } from '../utils/logging.ts'
import { execFilePromise, unlink } from '../utils/node-utils.ts'

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
      const delayMs = 1000 * 2 ** (attempt - 1) // 1s, 2s, 4s, ...
      l.dim(
        `Retry ${attempt} of ${maxRetries} failed. Waiting ${delayMs} ms before next attempt...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}