// src/utils/cleanUpFiles.js

import { unlink } from 'node:fs/promises'

export async function cleanUpFiles(id) {
  try {
    console.log(`\nTemporary files removed:`)
    await unlink(`${id}.wav`)
    console.log(`  - ${id}.wav`)
    await unlink(`${id}.lrc`)
    console.log(`  - ${id}.lrc`)
    await unlink(`${id}.txt`)
    console.log(`  - ${id}.txt`)
    await unlink(`${id}.md`)
    console.log(`  - ${id}.md`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting file:`, error)
    }
  }
}