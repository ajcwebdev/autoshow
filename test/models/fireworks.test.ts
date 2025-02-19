// test/models/fireworks.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Fireworks model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --fireworks',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-fireworks-shownotes.md', newName: '01-fireworks-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-fireworks-shownotes.md', newName: '02-fireworks-default.md' }
    ]
  },
  {
    // Process video with LLAMA 3 1 405B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks LLAMA_3_1_405B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '03-fireworks-llama-3-1-405b.md'
  },
  {
    // Process video with LLAMA 3 1 70B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks LLAMA_3_1_70B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '04-fireworks-llama-3-1-70b.md'
  },
  {
    // Process video with LLAMA 3 1 8B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks LLAMA_3_1_8B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '05-fireworks-llama-3-1-8b.md'
  },
  {
    // Process video with LLAMA 3 2 3B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks LLAMA_3_2_3B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '06-fireworks-llama-3-2-3b.md'
  },
  {
    // Process video with LLAMA 3 2 1B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks LLAMA_3_2_1B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '07-fireworks-llama-3-2-1b.md'
  },
  {
    // Process video with QWEN 2 5 72B model
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks QWEN_2_5_72B',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '08-fireworks-qwen-2-5-72b.md'
  }
]

test(' Fireworks Command Tests', async (t) => {
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