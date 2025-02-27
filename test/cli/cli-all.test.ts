// test/cli/cli-all.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process single YouTube video using AutoShow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01-video-default.md'
  },
  {
    // Process all videos in a specified YouTube playlist.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '02-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '03-playlist-default.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file.
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '04-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '05-urls-default.md' }
    ]
  },
  {
    // Process single local audio file.
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '06-file-default.md'
  },
  {
    // Process local audio file with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --ollama qwen2.5:0.5b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '07-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    // Process local audio file with Whisper 'tiny' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '08-whisper-tiny.md'
  },
  {
    // Process local audio file with all available prompt options (except smallChapters and longChapters)
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '09-all-prompts.md'
  },
  {
    // Process local audio file with multiple prompt sections, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary shortChapters takeaways questions --whisper tiny --ollama qwen2.5:0.5b',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '10-all-prompts-ollama-shownotes.md'
  },
  {
    // Process playlist videos with titles and longChapters prompts, tiny Whisper model, and Ollama for LLM processing.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles longChapters --whisper tiny --ollama qwen2.5:0.5b',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '11-playlist-prompts-whisper-ollama-shownotes-ep1.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '12-playlist-prompts-whisper-ollama-shownotes-ep0.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --ollama qwen2.5:0.5b',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '13-urls-prompts-whisper-ollama-shownotes-ep1.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '14-urls-prompts-whisper-ollama-shownotes-ep0.md' }
    ]
  },
  {
    // Process podcast RSS feed from default order.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --whisper tiny',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '15-rss-whisper-tiny.md'
  },
  {
    // Download JSON file with metadata for each item in the RSS feed.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '16-ajcwebdev-rss-info.json',
  },
  {
    // process file using ChatGPT for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '17-chatgpt-default.md'
  },
  {
    // Process file with ChatGPT using gpt-4o-mini model.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt gpt-4o-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '18-chatgpt-gpt-4o-mini.md'
  },
  {
    // process file using Claude for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '19-claude-default.md'
  },
  {
    // Process file with Claude using claude-3-haiku-20240307 model.
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-haiku-20240307',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '20-claude-shownotes.md'
  },
  {
    // process file using Gemini for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '21-gemini-shownotes.md'
  },
  {
    // Process file with Gemini using gemini-1.5-flash model.
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-1.5-flash',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '22-gemini-shownotes.md'
  },
  {
    // process file using DeepSeek for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '23-deepseek-shownotes.md'
  },
  {
    // process file using Fireworks for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '24-fireworks-shownotes.md'
  },
  {
    // process file using Together for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '25-together-shownotes.md'
  },
  {
    // process file using Deepgram for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram',
    expectedFile: 'audio-prompt.md',
    newName: '26-deepgram-prompt.md'
  },
  {
    // Process file using Deepgram and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '27-deepgram-chatgpt-shownotes.md'
  },
  {
    // process file using AssemblyAI for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly',
    expectedFile: 'audio-prompt.md',
    newName: '28-assembly-prompt.md'
  },
  {
    // Process file using AssemblyAI and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '29-assembly-chatgpt-shownotes.md'
  },
  {
    // Process an audio file using AssemblyAI with speaker labels
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '30-assembly-speaker-labels-prompt.md'
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