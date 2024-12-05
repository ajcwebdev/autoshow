// test/bench.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

type Command = {
  cmd: string
  expectedFile: string
  newName: string
}

const commands: Command[] = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '01_BASE_WHISPERCPP.md'
  },

  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker base',
    expectedFile: 'audio-prompt.md',
    newName: '02_BASE_WHISPERCPP_DOCKER.md'
  },

  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython base',
    expectedFile: 'audio-prompt.md',
    newName: '03_BASE_PYTHON.md'
  },

  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization base',
    expectedFile: 'audio-prompt.md',
    newName: '04_BASE_DIARIZATION.md'
  },
]

test('Autoshow Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })

      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
      
      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})