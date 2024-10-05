// src/utils/cleanUpFiles.js

import { unlink } from 'node:fs/promises'
import { log, step, success } from '../types.js'

/**
 * Asynchronous function to clean up temporary files.
 * @param {string} id - The base filename (without extension) for the files to be cleaned up.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs while deleting files.
 */
export async function cleanUpFiles(id) {
  log(step('\nStep 5 - Cleaning up temporary files...\n'))
  // Array of file extensions to delete
  const extensions = ['.wav', '.txt', '.md', '.lrc']

  log(success(`  Deleted:`))
  for (const ext of extensions) {
    try {
      await unlink(`${id}${ext}`)
      log(success(`    - ${id}${ext}`))
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting file ${id}${ext}: ${error.message}`)
      }
      // If the file does not exist, silently continue
    }
  }
}