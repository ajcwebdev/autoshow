// src/utils/step-utils/02-save-audio.ts

import { unlink } from 'node:fs/promises'
import { l, err } from '../logging'

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