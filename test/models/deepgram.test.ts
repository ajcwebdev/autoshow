// test/models/deepgram.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts, Deepgram default model, and ChatGPT default model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --deepgram --chatgpt',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '01-chatgpt-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '02-chatgpt-default.md' }
    ]
  },
  {
    // Process audio with Deepgram using BASE model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram BASE',
    expectedFile: 'audio-prompt.md',
    newName: '03-chatgpt-gpt-4o-mini.md'
  },
  {
    // Process audio with Deepgram using ENHANCED model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram ENHANCED',
    expectedFile: 'audio-prompt.md',
    newName: '04-chatgpt-gpt-4o.md'
  },
  {
    // Process audio with Deepgram using NOVA model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram NOVA',
    expectedFile: 'audio-prompt.md',
    newName: '05-deepgram-nova.md'
  },
  {
    // Process audio with Deepgram using NOVA_2 model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram NOVA_2',
    expectedFile: 'audio-prompt.md',
    newName: '06-deepgram-nova-2.md'
  },
]

test('Autoshow Command Tests', async (t) => {
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