// test/docker.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '01-docker-ajcwebdev-rss-info.json',
  },
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --whisper tiny',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '02-docker-rss-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '03-docker-video-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --whisper tiny',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '04-docker-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '05-docker-playlist-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --urls "content/example-urls.md" --whisper tiny',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '06-docker-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '07-docker-urls-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '08-docker-file-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles --whisper base --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '09-docker-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '10-docker-all-prompts.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '11-docker-three-prompts-chatgpt-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '12-docker-three-prompts-claude-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --cohere',
    expectedFile: 'audio-cohere-shownotes.md',
    newName: '13-docker-three-prompts-cohere-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --gemini',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '14-docker-three-prompts-gemini-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --mistral',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '15-docker-three-prompts-mistral-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --fireworks',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '16-docker-three-prompts-fireworks-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '17-docker-three-prompts-together-shownotes.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --prompt titles summary shortChapters --whisper base --groq',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '18-docker-three-prompts-groq-shownotes.md'
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