// test/models/deepgram.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process audio with Deepgram using nova-2 model.
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --deepgram nova-2',
    expectedFile: 'audio-prompt.md',
    newName: '02-DEEPGRAM-01-deepgram-nova-2.md'
  },
  {
    // Process audio with Deepgram using base model.
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --deepgram base',
    expectedFile: 'audio-prompt.md',
    newName: '02-DEEPGRAM-02-deepgram-base.md'
  },
  {
    // Process audio with Deepgram using enhanced model.
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --deepgram enhanced',
    expectedFile: 'audio-prompt.md',
    newName: '02-DEEPGRAM-03-deepgram-enhanced.md'
  },
]

test(' Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      if (Array.isArray(command.expectedFile)) {
        for (const { file, newName } of command.expectedFile) {
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