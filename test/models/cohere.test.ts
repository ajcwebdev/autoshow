// test/models/cohere.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Cohere model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --cohere',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-cohere-shownotes.md', newName: '01-cohere-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md', newName: '02-cohere-default.md' }
    ]
  },
  {
    // Process video with Cohere Command R model
    cmd: 'npm run as -- --file "content/audio.mp3" --cohere COMMAND_R',
    expectedFile: 'audio-cohere-shownotes.md',
    newName: '03-cohere-command-r.md'
  },
  {
    // Process video with Cohere Command R Plus model
    cmd: 'npm run as -- --file "content/audio.mp3" --cohere COMMAND_R_PLUS',
    expectedFile: 'audio-cohere-shownotes.md',
    newName: '04-cohere-command-r-plus.md'
  }
]

test('Autoshow Cohere Command Tests', async (t) => {
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