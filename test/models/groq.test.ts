// test/models/groq.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Groq model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --groq',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-groq-shownotes.md', newName: '01-groq-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-groq-shownotes.md', newName: '02-groq-default.md' }
    ]
  },
  {
    // Process video with Llama 3.2 1B Preview model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_2_1B_PREVIEW',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '03-groq-llama-3-2-1b-preview.md'
  },
  {
    // Process video with Llama 3.2 3B Preview model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_2_3B_PREVIEW',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '04-groq-llama-3-2-3b-preview.md'
  },
  {
    // Process video with Llama 3.3 70B Versatile model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_3_70B_VERSATILE',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '05-groq-llama-3-3-70b-versatile.md'
  },
  {
    // Process video with Llama 3.1 8B Instant model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_1_8B_INSTANT',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '06-groq-llama-3-1-8b-instant.md'
  },
  {
    // Process video with Mixtral 8x7B Instruct model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq MIXTRAL_8X7B_INSTRUCT',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '07-groq-mixtral-8x7b-instruct.md'
  },
]

test('Autoshow Groq Command Tests', async (t) => {
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