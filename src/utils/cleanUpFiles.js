// src/utils/cleanUpFiles.js

import { unlink } from 'node:fs/promises'

/**
 * Asynchronous function to clean up temporary files.
 * @param {string} id - The identifier for the files to be cleaned up.
 * @returns {Promise<void>}
 */
export async function cleanUpFiles(id) {
  try {
    // Log the start of the cleanup process
    console.log(`\nTemporary files removed:`)

    // Remove .wav file
    await unlink(`${id}.wav`)
    console.log(`  - ${id}.wav`)

    // Remove .lrc file
    await unlink(`${id}.lrc`)
    console.log(`  - ${id}.lrc`)

    // Remove .txt file
    await unlink(`${id}.txt`)
    console.log(`  - ${id}.txt`)

    // Remove .md file
    await unlink(`${id}.md`)
    console.log(`  - ${id}.md`)
  } catch (error) {
    // If the error is not "file not found", log the error
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting file:`, error)
    }
    // If the error is "file not found", silently ignore it
  }
}