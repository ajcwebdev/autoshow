// scripts/cleanContent.ts

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { l, err } from '../src/types/globals'

const execAsync = promisify(exec)

async function cleanContent() {
  try {
    const { stdout, stderr } = await execAsync(
      'find content -type f -not \\( -name ".gitkeep" -o -name "audio.mp3" -o -name "example-urls.md" \\) -delete'
    )
    if (stderr) {
      err('Error:', stderr)
      return
    }
    l('Files deleted successfully')
    if (stdout) {
      l('Output:', stdout)
    }
  } catch (error) {
    err('Execution error:', error)
  }
}

cleanContent()