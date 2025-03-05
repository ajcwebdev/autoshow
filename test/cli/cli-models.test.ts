// test/cli/cli-models.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/**
 * This single test suite consolidates *all* model tests from:
 *
 * - assembly.test.ts
 * - chatgpt.test.ts
 * - claude.test.ts
 * - deepgram.test.ts
 * - deepseek.test.ts
 * - fireworks.test.ts
 * - gemini.test.ts
 * - ollama.test.ts
 * - together.test.ts
 *
 * Each command object can define either:
 *   - `expectedFile` and `newName` for a single file output
 *   - `expectedFiles` (array) for multiple file outputs
 *
 * The test will run all commands sequentially and check for file creation and renaming.
 */

const assemblyCommands = [
  {
    // Process multiple YouTube videos from URLs with title prompts, Assembly default model, and ChatGPT default model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --assembly --chatgpt',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '01-assembly-default-chatgpt-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '02-assembly-default-chatgpt-default.md' }
    ]
  },
  {
    // Process audio with Assembly using BEST model.
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly BEST',
    expectedFile: 'audio-prompt.md',
    newName: '03-assembly-best.md'
  },
  {
    // Process audio with Assembly using NANO model.
    cmd: 'npm run as -- --file "content/audio.mp3" --assembly NANO',
    expectedFile: 'audio-prompt.md',
    newName: '04-assembly-nano.md'
  },
]

const deepgramCommands = [
  {
    // Process multiple YouTube videos from URLs with title prompts, Deepgram default model, and ChatGPT default model.
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --deepgram --chatgpt',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-chatgpt-shownotes.md', newName: '05-deepgram-default-chatgpt-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md', newName: '06-deepgram-default-chatgpt-default.md' }
    ]
  },
  {
    // Process audio with Deepgram using NOVA_2 model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram NOVA_2',
    expectedFile: 'audio-prompt.md',
    newName: '07-deepgram-nova-2.md'
  },
  {
    // Process audio with Deepgram using BASE model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram BASE',
    expectedFile: 'audio-prompt.md',
    newName: '08-deepgram-base.md'
  },
  {
    // Process audio with Deepgram using ENHANCED model.
    cmd: 'npm run as -- --file "content/audio.mp3" --deepgram ENHANCED',
    expectedFile: 'audio-prompt.md',
    newName: '09-deepgram-enhanced.md'
  },
]

/*
  LLM_SERVICES_CONFIG.chatgpt.models:
    - gpt-4.5-preview
    - gpt-4o
    - gpt-4o-mini
    - o1-mini
*/
const chatgptCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '10-chatgpt-default.md'
  },
  // TOO EXPENSIVE TO TEST FREQUENTLY COME ON SAM
  // {
  //   cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt gpt-4.5-preview',
  //   expectedFile: 'audio-chatgpt-shownotes.md',
  //   newName: '11-chatgpt-gpt-4.5-preview.md'
  // },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt gpt-4o',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '12-chatgpt-gpt-4o.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt gpt-4o-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '13-chatgpt-gpt-4o-mini.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --chatgpt o1-mini',
    expectedFile: 'audio-chatgpt-shownotes.md',
    newName: '14-chatgpt-o1-mini.md'
  },
]

/*
  LLM_SERVICES_CONFIG.claude.models:
    - claude-3-7-sonnet-latest
    - claude-3-5-haiku-latest
    - claude-3-opus-latest
*/
const claudeCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '15-claude-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-7-sonnet-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '16-claude-3-7-sonnet-latest.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-5-haiku-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '17-claude-3-5-haiku-latest.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-opus-latest',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '18-claude-3-opus-latest.md'
  },
]

/*
  LLM_SERVICES_CONFIG.deepseek.models:
    - deepseek-chat
    - deepseek-reasoner
*/
const deepseekCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '19-deepseek-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek deepseek-chat',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '20-deepseek-chat.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --deepseek deepseek-reasoner',
    expectedFile: 'audio-deepseek-shownotes.md',
    newName: '21-deepseek-reasoner.md'
  },
]

/*
  LLM_SERVICES_CONFIG.fireworks.models:
    - accounts/fireworks/models/llama-v3p1-405b-instruct
    - accounts/fireworks/models/llama-v3p1-70b-instruct
    - accounts/fireworks/models/llama-v3p1-8b-instruct
    - accounts/fireworks/models/llama-v3p2-3b-instruct
    - accounts/fireworks/models/qwen2p5-72b-instruct
*/
const fireworksCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '22-fireworks-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-405b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '23-fireworks-llama-v3p1-405b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-70b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '24-fireworks-llama-v3p1-70b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p1-8b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '25-fireworks-llama-v3p1-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks accounts/fireworks/models/llama-v3p2-3b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '26-fireworks-llama-v3p2-3b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --fireworks accounts/fireworks/models/qwen2p5-72b-instruct',
    expectedFile: 'audio-fireworks-shownotes.md',
    newName: '27-fireworks-qwen2p5-72b.md'
  },
]

/*
  LLM_SERVICES_CONFIG.gemini.models:
    - gemini-1.5-pro
    - gemini-1.5-flash-8b
    - gemini-1.5-flash
    - gemini-2.0-flash-lite
    - gemini-2.0-flash
*/
const geminiCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '28-gemini-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-1.5-pro',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '29-gemini-1.5-pro.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-1.5-flash-8b',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '30-gemini-1.5-flash-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-1.5-flash',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '31-gemini-1.5-flash.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-2.0-flash-lite',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '32-gemini-2.0-flash-lite.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --gemini gemini-2.0-flash',
    expectedFile: 'audio-gemini-shownotes.md',
    newName: '33-gemini-2.0-flash.md'
  },
]

/*
  LLM_SERVICES_CONFIG.together.models:
    - meta-llama/Llama-3.2-3B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
    - meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
    - google/gemma-2-27b-it
    - google/gemma-2-9b-it
    - Qwen/Qwen2.5-72B-Instruct-Turbo
    - Qwen/Qwen2.5-7B-Instruct-Turbo
*/
const togetherCommands = [
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together',
    expectedFile: 'audio-together-shownotes.md',
    newName: '34-together-default.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Llama-3.2-3B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '35-together-llama-3.2-3b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '36-together-llama-3.1-405b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '37-together-llama-3.1-70b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '38-together-llama-3.1-8b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together google/gemma-2-27b-it',
    expectedFile: 'audio-together-shownotes.md',
    newName: '39-together-gemma-2-27b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together google/gemma-2-9b-it',
    expectedFile: 'audio-together-shownotes.md',
    newName: '40-together-gemma-2-9b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together Qwen/Qwen2.5-72B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '41-together-qwen2.5-72b.md'
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --together Qwen/Qwen2.5-7B-Instruct-Turbo',
    expectedFile: 'audio-together-shownotes.md',
    newName: '42-together-qwen2.5-7b.md'
  },
]

/*
  LLM_SERVICES_CONFIG.ollama.models:
    - qwen2.5:0.5b
    - qwen2.5:1.5b
    - qwen2.5:3b
    - llama3.2:1b
    - llama3.2:3b
    - gemma2:2b
    - phi3.5:3.8b
    - deepseek-r1:1.5b
*/
// const ollamaCommands = [
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '01-ollama-default.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama qwen2.5:0.5b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '02-ollama-qwen2.5-0.5b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama qwen2.5:1.5b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '03-ollama-qwen2.5-1.5b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama qwen2.5:3b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '04-ollama-qwen2.5-3b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama llama3.2:1b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '05-ollama-llama3.2-1b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama llama3.2:3b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '06-ollama-llama3.2-3b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama gemma2:2b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '07-ollama-gemma2-2b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama phi3.5:3.8b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '08-ollama-phi3.5-3.8b.md'
//   },
//   {
//     cmd: 'npm run as -- --file "content/audio.mp3" --ollama deepseek-r1:1.5b',
//     expectedFile: 'audio-ollama-shownotes.md',
//     newName: '09-ollama-deepseek-r1-1.5b.md'
//   },
// ]

const allCommands = [
  ...assemblyCommands,
  ...chatgptCommands,
  ...claudeCommands,
  ...deepgramCommands,
  ...deepseekCommands,
  ...fireworksCommands,
  ...geminiCommands,
  ...togetherCommands,
  // ...ollamaCommands,
]

test('All Models Command Tests', async (t) => {
  for (const [index, command] of allCommands.entries()) {
    await t.test(`Command #${index + 1}: ${command.cmd}`, async () => {
      execSync(command.cmd, { stdio: 'inherit' })
      if (Array.isArray(command.expectedFile)) {
        for (const { file, newName } of command.expectedFile) {
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