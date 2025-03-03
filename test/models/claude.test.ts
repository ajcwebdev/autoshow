// test/models/claude.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.claude.models:
    - claude-3-7-sonnet-latest
    - claude-3-5-haiku-latest
    - claude-3-opus-latest
*/

const commands = [
  // Default
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '01-claude-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-7-sonnet-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '02-claude-3-7-sonnet-latest.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-5-haiku-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '03-claude-3-5-haiku-latest.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-opus-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '04-claude-3-opus-latest.md'
  },
]

test('Claude Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`Claude test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})