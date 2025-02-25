// test/models/chatgpt.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and ChatGPT default model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --chatgpt',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '01-chatgpt-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '02-chatgpt-default.md' }
    ]
  },
  {
    // Process video with ChatGPT using gpt-4o-mini model.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt gpt-4o-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '03-chatgpt-gpt-4o-mini.md'
  },
  {
    // Process video with ChatGPT using GPT_4o model.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt GPT_4o',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '04-chatgpt-gpt-4o.md'
  },
  {
    // Process video with ChatGPT using GPT_o1_MINI model.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt GPT_o1_MINI',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '05-chatgpt-gpt-o1-mini.md'
  },
]

test(' Command Tests', async (t) => {
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