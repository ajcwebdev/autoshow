// test/models/gemini.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Gemini model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --gemini',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-gemini-shownotes.md', newName: '01-gemini-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md', newName: '02-gemini-default.md' }
    ]
  },
  {
    // Process video with Gemini 1.5 Flash-8B model
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini GEMINI_1_5_FLASH_8B',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '03-gemini-1-5-flash-8b.md'
  },
  {
    // Process video with Gemini 1.5 Flash model
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini GEMINI_1_5_FLASH',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '04-gemini-1-5-flash.md'
  },
  {
    // Process video with Gemini 1.5 Pro model
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini GEMINI_1_5_PRO',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-gemini-1-5-pro.md'
  }
]

test(' Gemini Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      
      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
          const filePath = join('content', file)
          strictEqual(existsSync(filePath), true, `Expected file ${file} was not created`)
          const newPath = join('content', newName)
          renameSync(filePath, newPath)
          strictEqual(existsSync(newPath), true, `File was not renamed to ${newName}`)
        }
      } else {
        const filePath = join('content', command.expectedFile as string)
        strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = join('content', command.newName as string)
        renameSync(filePath, newPath)
        strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})