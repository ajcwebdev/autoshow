// test/services.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts, Whisper 'tiny' model, and ChatGPT GPT_4o_MINI model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --chatgpt GPT_4o_MINI',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '01-chatgpt-gpt-4o-mini.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '02-chatgpt-gpt-4o-mini.md' }
    ]
  },
  {
    // process video using ChatGPT for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '03-chatgpt-default.md'
  },
  {
    // Process video with ChatGPT using GPT_4o_MINI model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '04-chatgpt-gpt-4o-mini.md'
  },
  {
    // process video using Claude for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '05-claude-default.md'
  },
  {
    // Process video with Claude using CLAUDE_3_SONNET model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '06-claude-claude-3-sonnet-shownotes.md'
  },
  {
    // process video using Gemini for LLM operations.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '07-gemini-shownotes.md'
  },
  {
    // Process video with Gemini using GEMINI_1_5_FLASH model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '08-gemini-1-5-flash-shownotes.md'
  },
  {
    // process video using Cohere for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '09-cohere-default-shownotes.md'
  },
  {
    // Process video with Cohere using COMMAND_R_PLUS model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '10-cohere-command-r-plus-shownotes.md'
  },
  {
    // process video using Mistral for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '11-mistral-shownotes.md'
  },
  {
    // Process video with Mistral using MIXTRAL_8x7b model.
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '12-mistral-shownotes.md'
  },
  {
    // process video using Fireworks for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --fireworks',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-fireworks-shownotes.md',
    newName: '13-fireworks-shownotes.md'
  },
  {
    // process video using Together for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --together',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-together-shownotes.md',
    newName: '14-together-shownotes.md'
  },
  {
    // process video using BLANK for LLM operations
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-groq-shownotes.md',
    newName: '15-groq-shownotes.md'
  },
  {
    // process video using Deepgram for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '16-deepgram-prompt.md'
  },
  {
    // Process video using Deepgram Nova 2 model
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram NOVA_2',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '17-deepgram-nova-2-prompt.md'
  },
  {
    // process video using AssemblyAI for transcription
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '18-assembly-prompt.md'
  },
  {
    // Process video using AssemblyAI Nano model
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly NANO',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '19-assembly-nano-prompt.md'
  },
  {
    // Process an audio file using AssemblyAI with speaker labels
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '20-assembly-speaker-labels-prompt.md'
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