// test/models/chatgpt.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/*
  LLM_SERVICES_CONFIG.chatgpt.models:
    - gpt-4.5-preview
    - gpt-4o
    - gpt-4o-mini
    - o1-mini
*/

const commands = [
  // {
  //   cmd: 'npm run as -- --file "content/examples/audio.mp3" --chatgpt gpt-4.5-preview',
  //   expectedFile: 'audio-chatgpt-shownotes.md',
  //   newName: '03-CHATGPT-01-chatgpt-gpt-4.5-preview.md'
  // },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --chatgpt gpt-4o',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '03-CHATGPT-02-chatgpt-gpt-4o.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --chatgpt gpt-4o-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '03-CHATGPT-03-chatgpt-gpt-4o-mini.md'
  },
  {
    cmd: 'npm run as -- --file "content/examples/audio.mp3" --chatgpt o1-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '03-CHATGPT-04-chatgpt-o1-mini.md'
  },
]

test('ChatGPT Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`ChatGPT test #${index + 1}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})