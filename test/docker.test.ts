// test/docker.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run docker-cli -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01-docker-video-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --whisper base',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '02-docker-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '03-docker-playlist-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --urls "content/example-urls.md" --whisper base',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '04-docker-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '05-docker-urls-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '06-docker-file-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles --whisper base --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '07-docker-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '08-docker-whisper-tiny.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '09-docker-all-prompts.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters takeaways questions --whisper base --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '10-docker-all-prompts-ollama-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisper base --ollama LLAMA_3_2_1B',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '11-docker-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '12-docker-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --urls "content/example-urls.md" --prompt titles --whisper base --ollama LLAMA_3_2_1B',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '13-docker-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '14-docker-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --whisper base',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '15-docker-rss-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '16-docker-ajcwebdev-rss-info.json',
  },
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