// src/utils/cleanUpFiles.js

import fs from 'fs'

export function cleanUpFiles(id) {
  const files = [`${id}.wav`, `${id}.lrc`, `${id}.txt`]
  console.log(`\nIntermediate files deleted:`)
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`  - ${file}`)
    }
  }
}