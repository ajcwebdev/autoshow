// test/models/fireworks.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.fireworks.models:
    - accounts/fireworks/models/llama-v3p1-405b-instruct
    - accounts/fireworks/models/llama-v3p1-70b-instruct
    - accounts/fireworks/models/llama-v3p1-8b-instruct
    - accounts/fireworks/models/qwen2p5-72b-instruct
*/

const commands = [
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-405b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '07-FIREWORKS-01-fireworks-llama-v3p1-405b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-70b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '07-FIREWORKS-02-fireworks-llama-v3p1-70b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-8b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '07-FIREWORKS-03-fireworks-llama-v3p1-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --fireworks accounts/fireworks/models/qwen2p5-72b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '07-FIREWORKS-05-fireworks-qwen2p5-72b.md'
  },
]

test('Fireworks Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`Fireworks test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})