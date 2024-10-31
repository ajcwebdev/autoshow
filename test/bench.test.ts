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
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '01_TINY_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '02_BASE_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper small',
    expectedFile: 'audio-prompt.md',
    newName: '03_SMALL_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper medium',
    expectedFile: 'audio-prompt.md',
    newName: '04_MEDIUM_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper large-v1',
    expectedFile: 'audio-prompt.md',
    newName: '05_LARGE_V1_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper large-v2',
    expectedFile: 'audio-prompt.md',
    newName: '06_LARGE_V2_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper large-v3-turbo',
    expectedFile: 'audio-prompt.md',
    newName: '07_LARGE_V3_TURBO_WHISPERCPP.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker tiny',
    expectedFile: 'audio-prompt.md',
    newName: '08_TINY_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker base',
    expectedFile: 'audio-prompt.md',
    newName: '09_BASE_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker small',
    expectedFile: 'audio-prompt.md',
    newName: '10_SMALL_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker medium',
    expectedFile: 'audio-prompt.md',
    newName: '11_MEDIUM_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker large-v1',
    expectedFile: 'audio-prompt.md',
    newName: '12_LARGE_V1_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker large-v2',
    expectedFile: 'audio-prompt.md',
    newName: '13_LARGE_V2_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker large-v3-turbo',
    expectedFile: 'audio-prompt.md',
    newName: '14_LARGE_V3_TURBO_WHISPERCPP_DOCKER.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython tiny',
    expectedFile: 'audio-prompt.md',
    newName: '15_TINY_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython base',
    expectedFile: 'audio-prompt.md',
    newName: '16_BASE_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython small',
    expectedFile: 'audio-prompt.md',
    newName: '17_SMALL_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython medium',
    expectedFile: 'audio-prompt.md',
    newName: '18_MEDIUM_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython large-v1',
    expectedFile: 'audio-prompt.md',
    newName: '19_LARGE_V1_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython large-v2',
    expectedFile: 'audio-prompt.md',
    newName: '20_LARGE_V2_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperPython large-v3-turbo',
    expectedFile: 'audio-prompt.md',
    newName: '21_LARGE_V3_TURBO_PYTHON.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization tiny',
    expectedFile: 'audio-prompt.md',
    newName: '22_TINY_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization base',
    expectedFile: 'audio-prompt.md',
    newName: '23_BASE_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization small',
    expectedFile: 'audio-prompt.md',
    newName: '24_SMALL_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization medium',
    expectedFile: 'audio-prompt.md',
    newName: '25_MEDIUM_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization large-v1',
    expectedFile: 'audio-prompt.md',
    newName: '26_LARGE_V1_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization large-v2',
    expectedFile: 'audio-prompt.md',
    newName: '27_LARGE_V2_DIARIZATION.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDiarization large-v3-turbo',
    expectedFile: 'audio-prompt.md',
    newName: '28_LARGE_V3_TURBO_DIARIZATION.md'
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