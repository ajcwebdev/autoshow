// test/models/deepseek.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.deepseek.models:
    - deepseek-chat
    - deepseek-reasoner
*/

const commands = [
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --deepseek deepseek-chat',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '06-DEEPSEEK-01-deepseek-chat.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --deepseek deepseek-reasoner',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '06-DEEPSEEK-02-deepseek-reasoner.md'
  },
]

test('DeepSeek Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`DeepSeek test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})