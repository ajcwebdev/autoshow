// src/utils/cleanUpFiles.js

import { unlink } from 'node:fs/promises'

export async function cleanUpFiles(id) {
  try {
    await unlink(`${id}.wav`)
    await unlink(`${id}.lrc`)
    await unlink(`${id}.txt`)
    await unlink(`${id}.md`)
    console.log(`\nTemporary files removed:`)
    console.log(`  - ${id}.wav\n  - ${id}.lrc\n  - ${id}.txt\n`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting file:`, error)
    }
  }
}