// utils/perf.js

import { execSync } from 'child_process'
import { writeFileSync, appendFileSync, renameSync } from 'fs'
import fs from 'fs'
import { join } from 'path'

// Get the video URL from command-line arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Please provide the video URL as a command-line argument')
  process.exit(1)
}
const videoURL = args[0]

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const commands = [
  { cmd: `node autogen.js --profile -m large --video "${videoURL}"`, suffix: 'large' },
  { cmd: `node autogen.js --profile -m medium --video "${videoURL}"`, suffix: 'medium' },
  { cmd: `node autogen.js --profile -m base --video "${videoURL}"`, suffix: 'base' },
  { cmd: `node --env-file=.env autogen.js --profile --deepgram --video "${videoURL}"`, suffix: 'deepgram' },
  { cmd: `node --env-file=.env autogen.js --profile --assembly --video "${videoURL}"`, suffix: 'assembly' }
]

commands.forEach((commandObj, index) => {
  const { cmd, suffix } = commandObj
  const outputFileName = `performance_output_${suffix}_${timestamp}.txt`
  const originalShowNotesFile = `show_notes_${suffix}.txt`
  const newShowNotesFile = `show_notes_${suffix}_${timestamp}.txt`
  
  try {
    const start = Date.now()
    
    // Execute the command and capture the output
    const output = execSync(cmd, { encoding: 'utf8' })
    const end = Date.now()
    
    // Write the performance output to a file
    writeFileSync(join(process.cwd(), outputFileName), output)
    
    // Write the execution time to the file
    const duration = `Execution Time: ${(end - start) / 1000} seconds\n`
    appendFileSync(join(process.cwd(), outputFileName), duration)
    
    // Rename show notes file to ensure uniqueness
    if (fs.existsSync(join(process.cwd(), originalShowNotesFile))) {
      renameSync(join(process.cwd(), originalShowNotesFile), join(process.cwd(), newShowNotesFile))
    }

    console.log(`Command ${index + 1} executed successfully. Output written to ${outputFileName}`)
  } catch (error) {
    console.error(`Error executing command ${index + 1}:`, error)
  }
})