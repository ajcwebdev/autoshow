// test/models/ollama.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.ollama.models:
    - qwen2.5:0.5b
    - qwen2.5:1.5b
    - qwen2.5:3b
    - llama3.2:1b
    - llama3.2:3b
    - gemma2:2b
    - phi3.5:3.8b
    - deepseek-r1:1.5b
*/

const commands = [
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-01-ollama-default.md',
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama qwen2.5:0.5b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-02-ollama-qwen2.5-0.5b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama qwen2.5:1.5b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-03-ollama-qwen2.5-1.5b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama qwen2.5:3b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-04-ollama-qwen2.5-3b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama llama3.2:1b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-05-ollama-llama3.2-1b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama llama3.2:3b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-06-ollama-llama3.2-3b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama gemma2:2b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-07-ollama-gemma2-2b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama phi3.5:3.8b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-08-ollama-phi3.5-3.8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --ollama deepseek-r1:1.5b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-OLLAMA-09-ollama-deepseek-r1-1.5b.md'
  },
]

test('Ollama Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`Ollama test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})