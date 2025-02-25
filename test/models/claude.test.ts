// test/models/claude.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Claude model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --claude',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-claude-shownotes.md', newName: '01-claude-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md', newName: '02-claude-default.md' }
    ]
  },
  {
    // Process video with Claude 3.5 Sonnet model
    cmd: 'npm run as -- --file "content/audio.mp3" --claude CLAUDE_3_5_SONNET',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '03-claude-3-5-sonnet.md'
  },
  {
    // Process video with Claude 3.5 Haiku model
    cmd: 'npm run as -- --file "content/audio.mp3" --claude claude-3-haiku-20240307',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '04-claude-3-5-haiku.md'
  },
  {
    // Process video with Claude 3 Opus model
    cmd: 'npm run as -- --file "content/audio.mp3" --claude CLAUDE_3_OPUS',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '05-claude-3-opus.md'
  },
  {
    // Process video with Claude 3 Sonnet model
    cmd: 'npm run as -- --file "content/audio.mp3" --claude CLAUDE_3_SONNET',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '06-claude-3-sonnet.md'
  },
  {
    // Process video with Claude 3 Haiku model
    cmd: 'npm run as -- --file "content/audio.mp3" --claude CLAUDE_3_HAIKU',
    expectedFile: 'audio-claude-shownotes.md',
    newName: '07-claude-3-haiku.md'
  },
]

test(' Command Tests', async (t) => {
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