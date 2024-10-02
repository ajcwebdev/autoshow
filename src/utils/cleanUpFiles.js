// src/utils/cleanUpFiles.js

import { unlink } from 'node:fs/promises'

/**
 * Asynchronous function to clean up temporary files.
 * @param {string} id - The base filename (without extension) for the files to be cleaned up.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs while deleting files.
 */
export async function cleanUpFiles(id) {
  // Array of file extensions to delete
  const extensions = ['.wav', '.txt', '.md', '.lrc']

  // Log the start of the cleanup process
  console.log('\nStep 5 - Cleaning up temporary files...')

  for (const ext of extensions) {
    try {
      await unlink(`${id}${ext}`)
      console.log(`  - ${id}${ext}`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting file ${id}${ext}: ${error.message}`)
      }
      // If the file does not exist, silently continue
    }
  }
}