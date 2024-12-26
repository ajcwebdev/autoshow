// test/all.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process a single YouTube video using Autoshow's default settings.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01-video-default.md'
  },
  {
    // Process all videos in a specified YouTube playlist.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '02A-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '02B-playlist-default.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file.
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '03A-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '03B-urls-default.md' }
    ]
  },
  {
    // Process a single local audio file.
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '04-file-default.md'
  },
  {
    // Process local audio file with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '05-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    // Process local audio file with Whisper 'tiny' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisper tiny',
    expectedFile: 'audio-prompt.md',
    newName: '06-whisper-tiny.md'
  },
  {
    // Process a local audio file with all available prompt options (except smallChapters and longChapters)
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '07-all-prompts.md'
  },
  {
    // Process a local audio file with multiple prompt sections, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles summary shortChapters takeaways questions --whisper tiny --ollama',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '08-all-prompts-ollama-shownotes.md'
  },
  {
    // Process playlist videos with titles and longChapters prompts, tiny Whisper model, and Ollama for LLM processing.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles longChapters --whisper tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '09A-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '09B-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and Ollama.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --ollama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '10A-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '10B-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    // Process podcast RSS feed from default order.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --whisper tiny',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '11-rss-whisper-tiny.md'
  },
  {
    // Download JSON file with metadata for each item in the RSS feed.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '12-ajcwebdev-rss-info.json',
  },
  {
    cmd: 'npm run docker -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '15-docker-video-default.md'
  },
  {
    cmd: 'npm run docker -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '16A-docker-playlist-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '16B-docker-playlist-default.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '17A-docker-urls-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '17B-docker-urls-default.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '18-docker-file-default.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles --whisperDocker tiny --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '19-docker-titles-prompt-whisper-tiny-ollama-shownotes.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --whisperDocker tiny',
    expectedFile: 'audio-prompt.md',
    newName: '20-docker-whisper-tiny.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles summary mediumChapters takeaways questions',
    expectedFile: 'audio-prompt.md',
    newName: '21-docker-all-prompts.md'
  },
  {
    cmd: 'npm run docker -- --file "content/audio.mp3" --prompt titles summary shortChapters takeaways questions --whisperDocker tiny --ollama LLAMA_3_2_1B',
    expectedFile: 'audio-ollama-shownotes.md',
    newName: '22-docker-all-prompts-ollama-shownotes.md'
  },
  {
    cmd: 'npm run docker -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisperDocker tiny --ollama LLAMA_3_2_1B',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '23A-docker-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '23B-docker-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --urls "content/example-urls.md" --prompt titles --whisperDocker tiny --ollama LLAMA_3_2_1B',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-ollama-shownotes.md', newName: '24A-docker-prompt-whisper-ollama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md', newName: '24B-docker-prompt-whisper-ollama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run docker -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '25-docker-rss-default.md'
  },
  {
    cmd: 'npm run docker -- --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '26-docker-ajcwebdev-rss-info.json',
  },
  {
    // Process local audio file with Dockerized Whisper 'base' model.
    cmd: 'npm run as -- --file "content/audio.mp3" --whisperDocker base',
    expectedFile: 'audio-prompt.md',
    newName: '27-docker-whisper-docker-base.md'
  },
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and ChatGPT GPT_4o_MINI model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --chatgpt GPT_4o_MINI',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '28A-chatgpt-gpt-4o-mini.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '28B-chatgpt-gpt-4o-mini.md' }
    ]
  },
  {
    // Process a video using ChatGPT for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '29-chatgpt-default.md'
  },
  {
    // Process video with ChatGPT using GPT_4o_MINI model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '30-chatgpt-gpt-4o-mini.md'
  },
  {
    // Process a video using Claude for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '31-claude-default.md'
  },
  {
    // Process video with Claude using CLAUDE_3_SONNET model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '32-claude-shownotes.md'
  },
  {
    // Process a video using Gemini for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '33-gemini-shownotes.md'
  },
  {
    // Process video with Gemini using GEMINI_1_5_FLASH model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '34-gemini-shownotes.md'
  },
  {
    // Process a video using Cohere for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '35-cohere-shownotes.md'
  },
  {
    // Process video with Cohere using COMMAND_R_PLUS model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '36-cohere-shownotes.md'
  },
  {
    // Process a video using Mistral for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '37-mistral-shownotes.md'
  },
  {
    // Process video with Mistral using MIXTRAL_8x7b model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '38-mistral-shownotes.md'
  },
  {
    // Process a video using Fireworks for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-fireworks-shownotes.md',
    newName: '39-fireworks-shownotes.md'
  },
  {
    // Process a video using Together for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-together-shownotes.md',
    newName: '40-together-shownotes.md'
  },
  {
    // Process a video using BLANK for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-groq-shownotes.md',
    newName: '41-groq-shownotes.md'
  },
  {
    // Process a video using Deepgram for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '42-deepgram-prompt.md'
  },
  {
    // Process video using Deepgram and Llama.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram --ollama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md',
    newName: '43-deepgram-ollama-shownotes.md'
  },
  {
    // Process a video using AssemblyAI for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '44-assembly-prompt.md'
  },
  {
    // Process video using AssemblyAI and Llama.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly --ollama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md',
    newName: '45-assembly-ollama-shownotes.md'
  },
  {
    // Process an audio file using AssemblyAI with speaker labels
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '46-assembly-speaker-labels-prompt.md'
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