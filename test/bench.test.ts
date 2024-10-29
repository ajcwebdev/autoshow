// test/local.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

type Command = {
  cmd: string
  expectedFile: string
  newName: string
}

const commands: Command[] = [
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01_TINY_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '02_BASE_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper medium',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '03_MEDIUM_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v1',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '04_LARGE_V1_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v2',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '05_LARGE_V2_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper large-v3-turbo',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '06_LARGE_V3_WHISPERCPP.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDiarization tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '07_TINY_DIARIZATION.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDiarization base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '08_BASE_DIARIZATION.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDiarization medium',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '09_MEDIUM_DIARIZATION.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDiarization large-v1',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '10_LARGE_V1_DIARIZATION.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDiarization large-v2',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '11_LARGE_V2_DIARIZATION.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '12_TINY_PYTHON.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '13_BASE_PYTHON.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython medium',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '14_MEDIUM_PYTHON.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython large-v1',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '15_LARGE_V1_PYTHON.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython large-v2',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '16_LARGE_V2_PYTHON.md'
  },
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperPython large-v3-turbo',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '17_LARGE_V3_TURBO_PYTHON.md'
  }
]

test('Autoshow Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
      
      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})