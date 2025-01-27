// test/models/mistral.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Mistral model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --mistral',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-mistral-shownotes.md', newName: '01-mistral-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md', newName: '02-mistral-default.md' }
    ]
  },
  {
    // Process video with Mixtral 8x7B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MIXTRAL_8x7B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '03-mistral-mixtral-8x7b.md'
  },
  {
    // Process video with Mixtral 8x22B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MIXTRAL_8x22B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '04-mistral-mixtral-8x22b.md'
  },
  {
    // Process video with Mistral Large model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_LARGE',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '05-mistral-large.md'
  },
  {
    // Process video with Mistral Small model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_SMALL',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '06-mistral-small.md'
  },
  {
    // Process video with Ministral 8B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MINISTRAL_8B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '07-mistral-ministral-8b.md'
  },
  {
    // Process video with Ministral 3B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MINISTRAL_3B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '08-mistral-ministral-3b.md'
  },
  {
    // Process video with Mistral NeMo model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_NEMO',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '09-mistral-nemo.md'
  },
  {
    // Process video with Mistral 7B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_7B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '10-mistral-7b.md'
  }
]

test('Autoshow Mistral Command Tests', async (t) => {
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