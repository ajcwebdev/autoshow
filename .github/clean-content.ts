// scripts/clean-content.ts

import path from 'node:path'
import { promises as fs } from 'node:fs'
import { l, err } from '../src/utils/logging'

/**
 * List of filenames we want to keep.
 * Any file in `content` that is not in this list will be deleted.
 */
const ALLOWED_FILES = new Set([
  '.gitkeep',
  'audio.mp3',
  'example-urls.md',
  'example-rss-feeds.md',
  'custom-prompt.md',
])

/**
 * Recursively collects all file paths under the given directory.
 */
async function collectAllFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name)
    if (dirent.isDirectory()) {
      const subFiles = await collectAllFiles(fullPath)
      files.push(...subFiles)
    } else {
      files.push(fullPath)
    }
  }

  return files
}

async function cleanContent() {
  try {
    // Recursively gather all file paths in `content`
    const allFiles = await collectAllFiles('content')

    // Filter out the files that are NOT in the allowed list
    const filesToDelete = allFiles.filter((filePath) => {
      const fileName = path.basename(filePath)
      return !ALLOWED_FILES.has(fileName)
    })

    // Delete them
    await Promise.all(filesToDelete.map((file) => fs.unlink(file)))
    l('Files deleted successfully')
  } catch (error) {
    err('Execution error:', error)
  }
}

cleanContent()