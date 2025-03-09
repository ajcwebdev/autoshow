// test/cli/cli-local.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '01-LOCAL-01-file-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '01-LOCAL-02-file-whisper-tiny.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --prompt titles summary --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '01-LOCAL-03-file-prompts-ollama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01-LOCAL-04-video-default.md'
  },
  {
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '01-LOCAL-05-rss-default.md',
  },
]

test('AutoShow Command Tests', async (t) => {
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