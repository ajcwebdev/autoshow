// test/cli/cli-all.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process single YouTube video using Autoshow's default settings.
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
    cmd: 'npm run docker-cli -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper base',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '17-docker-video-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --whisper base',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '18-docker-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '19-docker-playlist-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --urls "content/example-urls.md" --whisper base',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '20-docker-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '21-docker-urls-default.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '22-docker-file-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '23-docker-whisper-tiny.md'
  },
  {
    cmd: 'npm run docker-cli -- --file "content/audio.mp3" --whisper base --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '24-docker-all-prompts.md'
  },
  {
    cmd: 'npm run docker-cli -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisper tiny --chatgpt',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '25-docker-prompt-whisper-chatgpt-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '26-docker-prompt-whisper-chatgpt-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --urls "content/example-urls.md" --prompt titles --whisper tiny --claude',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-claude-shownotes.md', newName: '27-docker-prompt-whisper-claude-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md', newName: '28-docker-prompt-whisper-claude-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --whisper base',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '29-docker-rss-default.md'
  },
  {
    cmd: 'npm run docker-cli -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '30-docker-ajcwebdev-rss-info.json',
  },
  {
    // Process local audio file with Dockerized Whisper 'base' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper base',
    expectedFile: 'audio-prompt.md',
    newName: '31-docker-whisper-docker-base.md'
  },
  {
    // process file using ChatGPT for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '32-chatgpt-default.md'
  },
  {
    // Process file with ChatGPT using GPT_4o_MINI model.
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt GPT_4o_MINI',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '33-chatgpt-gpt-4o-mini.md'
  },
  {
    // process file using Claude for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '34-claude-default.md'
  },
  {
    // Process file with Claude using CLAUDE_3_5_HAIKU model.
    cmd: 'npm run as -- --file "content/audio.mp3" --claude CLAUDE_3_5_HAIKU',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '35-claude-shownotes.md'
  },
  {
    // process file using Gemini for LLM operations.
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '36-gemini-shownotes.md'
  },
  {
    // Process file with Gemini using GEMINI_1_5_FLASH model.
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini GEMINI_1_5_FLASH',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '37-gemini-shownotes.md'
  },
  {
    // process file using DeepSeek for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '38-deepseek-shownotes.md'
  },
  {
    // process file using Fireworks for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '39-fireworks-shownotes.md'
  },
  {
    // process file using Together for LLM operations
    cmd: 'npm run as -- --file "content/audio.mp3" --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '40-together-shownotes.md'
  },
  {
    // process file using Deepgram for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram',
    expectedFile: 'audio-prompt.md',
    newName: '41-deepgram-prompt.md'
  },
  {
    // Process file using Deepgram and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '42-deepgram-chatgpt-shownotes.md'
  },
  {
    // process file using AssemblyAI for transcription
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly',
    expectedFile: 'audio-prompt.md',
    newName: '43-assembly-prompt.md'
  },
  {
    // Process file using AssemblyAI and ChatGPT.
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '44-assembly-chatgpt-shownotes.md'
  },
  {
    // Process an audio file using AssemblyAI with speaker labels
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '45-assembly-speaker-labels-prompt.md'
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