// scripts/cleanContent.ts

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function cleanContent() {
  try {
    const { stdout, stderr } = await execAsync(
      'find content -type f -not \\( -name ".gitkeep" -o -name "audio.mp3" -o -name "example-urls.md" \\) -delete'
    )
    if (stderr) {
      console.error('Error:', stderr)
      return
    }
    console.log('Files deleted successfully')
    if (stdout) {
      console.log('Output:', stdout)
    }
  } catch (error) {
    console.error('Execution error:', error)
  }
}

cleanContent()