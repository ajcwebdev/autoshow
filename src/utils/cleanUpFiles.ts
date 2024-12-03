// src/utils/cleanUpFiles.ts

/**
 * @file Utility for cleaning up temporary files generated during processing.
 * Handles removal of intermediate files with specific extensions.
 * @packageDocumentation
 */

import { unlink } from 'node:fs/promises'
import { l, err, step, success } from '../globals'

/**
 * Removes temporary files generated during content processing.
 * Attempts to delete files with specific extensions and logs the results.
 * Silently ignores attempts to delete non-existent files.
 * 
 * Files cleaned up include:
 * - .wav: Audio files
 * - .txt: Transcription text
 * - .md: Markdown content
 * - .lrc: Lyrics/subtitles
 * 
 * @param {string} id - Base filename (without extension) used to identify related files.
 *                     All files matching pattern `${id}${extension}` will be deleted.
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
 *   await cleanUpFiles('content/my-video-2024-03-21')
 *   // Will attempt to delete:
 *   // - content/my-video-2024-03-21.wav
 *   // - content/my-video-2024-03-21.txt
 *   // - content/my-video-2024-03-21.md
 *   // - content/my-video-2024-03-21.lrc
 * } catch (error) {
 *   err('Cleanup failed:', error)
 * }
 */
export async function cleanUpFiles(id: string): Promise<void> {
  l(step('\nStep 5 - Cleaning up temporary files...\n'))

  // Define extensions of temporary files to be cleaned up
  const extensions = [
    '.wav',  // Audio files
    '.txt',  // Transcription text
    '.md',   // Markdown content
    '.lrc'   // Lyrics/subtitles
  ]

  l(success(`  Temporary files deleted:`))

  // Attempt to delete each file type
  for (const ext of extensions) {
    try {
      // Delete file and log success
      await unlink(`${id}${ext}`)
      l(success(`    - ${id}${ext}`))
    } catch (error) {
      // Only log errors that aren't "file not found" (ENOENT)
      if (error instanceof Error && (error as Error).message !== 'ENOENT') {
        err(`Error deleting file ${id}${ext}: ${(error as Error).message}`)
      }
      // Silently continue if file doesn't exist
    }
  }
}