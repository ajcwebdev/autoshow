// test/models/together.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.together.models:
    - meta-llama/Llama-3.2-3B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
    - google/gemma-2-27b-it
    - google/gemma-2-9b-it
    - Qwen/Qwen2.5-72B-Instruct-Turbo
    - Qwen/Qwen2.5-7B-Instruct-Turbo
*/

const commands = [
  // Default
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '01-together-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Llama-3.2-3B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '02-together-llama-3.2-3b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '03-together-llama-3.1-405b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '04-together-llama-3.1-70b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '05-together-llama-3.1-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together google/gemma-2-27b-it',
    expectedFile: 'audio-together-shownotes.md',
    newName: '06-together-gemma-2-27b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together google/gemma-2-9b-it',
    expectedFile: 'audio-together-shownotes.md',
    newName: '07-together-gemma-2-9b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together Qwen/Qwen2.5-72B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '08-together-qwen2.5-72b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together Qwen/Qwen2.5-7B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '09-together-qwen2.5-7b.md'
  },
]

test('Together Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`Together test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})