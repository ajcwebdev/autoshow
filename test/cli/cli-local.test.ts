// test/cli/cli-local.test.ts

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
    // Process local audio file with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '02-file-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    // Process local audio file with Whisper 'tiny' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '03-file-whisper-tiny.md'
  },
  {
    // Process local audio file with all available prompt options (except smallChapters and longChapters)
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary mediumChapters takeaways questions --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '04-file-all-prompts.md'
  },
  {
    // Process local audio file with multiple prompt sections, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary --whisper tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '05-file-prompts-ollama-shownotes.md'
  },
  {
    // Process single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '06-video-default.md'
  },
  {
    // Process all videos in a specified YouTube playlist.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --whisper tiny',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '07-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '08-playlist-default.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file.
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '09-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '10-urls-default.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file with Tiny Whisper model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --whisper tiny',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '11-urls-whisper-tiny.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '12-urls-whisper-tiny.md' }
    ]
  },
  {
    // Download JSON file with metadata for each item in the RSS feed.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '13-rss-default.md',
  },
  {
    // Download JSON file with metadata for each video in the URLs file.
    cmd: 'npm run as -- --urls "content/example-urls.md" --info',
    expectedFile: 'urls_info.json',
    newName: '14-urls-info.json',
  },
  {
    // Download JSON file with metadata for each item in the RSS feed.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '15-rss-info.json',
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