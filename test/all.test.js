// test/all.test.js

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
    newName: '01---ep0-fsjam-podcast-prompt.md'
  },
  {
    // Process all videos in a specified YouTube playlist.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '02A---ep1-fsjam-podcast-prompt.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '02B---ep0-fsjam-podcast-prompt.md' }
    ]
  },
  {
    // Process playlist videos with custom title prompt, tiny Whisper model, and Llama for LLM processing.
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisper tiny --llama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-llama-shownotes.md', newName: '03A---ep1-fsjam-podcast-llama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md', newName: '03B---ep0-fsjam-podcast-llama-shownotes.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs listed in a file.
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '04A---ep1-fsjam-podcast-prompt.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '04B---ep0-fsjam-podcast-prompt.md' }
    ]
  },
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and Llama.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --llama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-llama-shownotes.md', newName: '05A---ep1-fsjam-podcast-llama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md', newName: '05B---ep0-fsjam-podcast-llama-shownotes.md' }
    ]
  },
  {
    // Process a single local audio file.
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '06---audio-prompt.md'
  },
  {
    // Process local audio file with title prompts, Whisper 'tiny' model, and Llama.
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --llama',
    expectedFile: 'audio-llama-shownotes.md',
    newName: '07---audio-llama-shownotes.md'
  },
  {
    // Process podcast RSS feed from default order.
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '08---thoughts-on-lambda-school-layoffs-prompt.md'
  },
  {
    // Process a video using ChatGPT for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '09---ep0-fsjam-podcast-chatgpt-shownotes.md'
  },
  {
    // Process video with ChatGPT using GPT_4o_MINI model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '10---ep0-fsjam-podcast-chatgpt-shownotes.md'
  },
  {
    // Process a video using Claude for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '11---ep0-fsjam-podcast-claude-shownotes.md'
  },
  {
    // Process video with Claude using CLAUDE_3_SONNET model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '12---ep0-fsjam-podcast-claude-shownotes.md'
  },
  // {
  //   // Process a video using Gemini for LLM operations.
  //   cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini',
  //   expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
  //   newName: '13---ep0-fsjam-podcast-gemini-shownotes.md'
  // },
  // {
  //   // Process video with Gemini using GEMINI_1_5_FLASH model.
  //   cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH',
  //   expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
  //   newName: '14---ep0-fsjam-podcast-gemini-shownotes.md'
  // },
  {
    // Process a video using Cohere for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '15---ep0-fsjam-podcast-cohere-shownotes.md'
  },
  {
    // Process video with Cohere using COMMAND_R_PLUS model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '16---ep0-fsjam-podcast-cohere-shownotes.md'
  },
  {
    // Process a video using Mistral for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '17---ep0-fsjam-podcast-mistral-shownotes.md'
  },
  {
    // Process video with Mistral using MIXTRAL_8x7b model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '18---ep0-fsjam-podcast-mistral-shownotes.md'
  },
  {
    // Process a video using OctoAI for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-octo-shownotes.md',
    newName: '19---ep0-fsjam-podcast-octo-shownotes.md'
  },
  {
    // Process video with Octo using LLAMA_3_1_8B model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo LLAMA_3_1_8B',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-octo-shownotes.md',
    newName: '20---ep0-fsjam-podcast-octo-shownotes.md'
  },
  {
    // Process a video using Llama for local LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '21---ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    // Process a video using Ollama for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --ollama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-ollama-shownotes.md',
    newName: '22---ep0-fsjam-podcast-ollama-shownotes.md'
  },
  {
    // Process a video using Deepgram for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '23---ep0-fsjam-podcast-prompt.md'
  },
  {
    // Process video using Deepgram and Llama.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '24---ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    // Process a video using AssemblyAI for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '25---ep0-fsjam-podcast-prompt.md'
  },
  {
    // Process video using AssemblyAI and Llama.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '26---ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    // Process an audio file using AssemblyAI with speaker labels
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '27---fsjam-short-prompt.md'
  },
  {
    // Process video using Whisper.cpp in Docker with 'tiny' model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisperDocker tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '28---ep0-fsjam-podcast-prompt.md'
  },
  {
    // Process a video with all available prompt options (except smallChapters and longChapters)
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary shortChapters mediumChapters longChapters takeaways questions',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '29---ep0-fsjam-podcast-prompt.md'
  },
  {
    // Process video with multiple prompt sections, Whisper 'tiny' model, and Llama.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary shortChapters takeaways questions --whisper tiny --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '30---ep0-fsjam-podcast-llama-shownotes.md'
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