// test/models/gemini.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.gemini.models:
    - gemini-1.5-pro
    - gemini-1.5-flash-8b
    - gemini-1.5-flash
    - gemini-2.0-flash-lite
    - gemini-2.0-flash
*/

const commands = [
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --gemini gemini-1.5-pro',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-GEMINI-01-gemini-1.5-pro.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --gemini gemini-1.5-flash-8b',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-GEMINI-02-gemini-1.5-flash-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --gemini gemini-1.5-flash',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-GEMINI-03-gemini-1.5-flash.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --gemini gemini-2.0-flash-lite',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-GEMINI-04-gemini-2.0-flash-lite.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --gemini gemini-2.0-flash',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '05-GEMINI-05-gemini-2.0-flash.md'
  },
]

test('Gemini Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`Gemini test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})