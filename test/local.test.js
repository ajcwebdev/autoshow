// test/local.test.js

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: 'FILE_01.md'
  },
  {
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: 'FILE_02A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: 'FILE_02B.md' }
    ]
  },
  {
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: 'FILE_03A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: 'FILE_03B.md' }
    ]
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: 'FILE_04.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --llama',
    expectedFile: 'audio-llama-shownotes.md',
    newName: 'FILE_05.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama LLAMA_3_2_3B',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md',
    newName: 'FILE_06.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: 'FILE_07.md'
  },
  // {
  //   cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDocker tiny',
  //   expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
  //   newName: 'FILE_08.md'
  // },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary mediumChapters takeaways questions',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: 'FILE_09.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary shortChapters takeaways questions --whisper tiny --ollama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md',
    newName: 'FILE_10.md'
  },
  {
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisper tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_11A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_11B.md' }
    ]
  },
  {
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_12A.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: 'FILE_12B.md' }
    ]
  },
  {
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: 'FILE_13.md'
  },
  {
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'rss_info.json',
    newName: 'FILE_14_rss_info.json',
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
        const filePath = join('content', command.expectedFile)
        strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = join('content', command.newName)
        renameSync(filePath, newPath)
        strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})