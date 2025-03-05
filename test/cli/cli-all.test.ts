// test/cli/cli-all.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process single local audio file.
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '01-file-default.md'
  },
  {
    // Process local audio file with Whisper 'tiny' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '02-file-whisper-tiny.md'
  },
  {
    // Process local audio file with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '03-file-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    // Process local audio file with all available prompt options (except smallChapters and longChapters)
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary',
    expectedFile: 'audio-prompt.md',
    newName: '04-file-prompts.md'
  },
  {
    // Process single YouTube video using AutoShow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '05-video-default.md'
  },
  {
    // Process all videos in a specified YouTube playlist.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '06-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '07-playlist-default.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file.
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '08-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '09-urls-default.md' }
    ]
  },
  {
    // Process podcast RSS feed from default order.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --whisper tiny',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '10-rss-whisper-tiny.md'
  },
  {
    // Download JSON file with metadata for each item in the RSS feed.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '11-ajcwebdev-rss-info.json',
  },
  {
    // process file using ChatGPT for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '12-chatgpt-default.md'
  },
  {
    // process file using Claude for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '13-claude-default.md'
  },
  {
    // process file using Gemini for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '14-gemini-shownotes.md'
  },
  {
    // process file using DeepSeek for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '15-deepseek-shownotes.md'
  },
  {
    // process file using Fireworks for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '16-fireworks-shownotes.md'
  },
  {
    // process file using Together for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '17-together-shownotes.md'
  },
  {
    // process file using Deepgram for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram',
    expectedFile: 'audio-prompt.md',
    newName: '18-deepgram-prompt.md'
  },
  {
    // Process file using Deepgram and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '19-deepgram-chatgpt-shownotes.md'
  },
  {
    // process file using AssemblyAI for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly',
    expectedFile: 'audio-prompt.md',
    newName: '20-assembly-prompt.md'
  },
  {
    // Process file using AssemblyAI and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '21-assembly-chatgpt-shownotes.md'
  }
]

test('AutoShow Command Tests', async (t) => {
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