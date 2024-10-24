// test/docker.test.js

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run docker -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: 'FILE_01.md'
  },
  {
    cmd: 'npm run docker -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: 'FILE_02A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: 'FILE_02B.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: 'FILE_03A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: 'FILE_03B.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: 'FILE_04.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles --whisperDocker tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: 'FILE_05.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --ollama LLAMA_3_2_3B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: 'FILE_06.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --whisperDocker tiny',
    expectedFile: 'audio-prompt.md',
    newName: 'FILE_07.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: 'FILE_08.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles summary shortChapters takeaways questions --whisperDocker tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: 'FILE_09.md'
  },
  {
    cmd: 'npm run docker -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisperDocker tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_10A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_10B.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --urls "content/example-urls.md" --prompt titles --whisperDocker tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_11A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_11B.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: 'FILE_12.md'
  },
  {
    cmd: 'npm run docker -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'rss_info.json',
    newName: 'FILE_13_rss_info.json',
  }
]

test('Autoshow Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })

      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
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