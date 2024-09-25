import test from 'node:test'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const commands = [
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '01---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '02---2024-09-24-ep1-fsjam-podcast-prompt.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '03---2024-09-24-ep0-fsjam-podcast-prompt.md' }
    ]
  },
  {
    cmd: 'npm run as -- --urls "content/example-urls.md"',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-prompt.md', newName: '04---2024-09-24-ep1-fsjam-podcast-prompt.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-prompt.md', newName: '05---2024-09-24-ep0-fsjam-podcast-prompt.md' }
    ]
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3"',
    expectedFile: 'audio-prompt.md',
    newName: '06---audio-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '07---2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --chatgpt GPT_4o_MINI',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md',
    newName: '08---2024-09-24-ep0-fsjam-podcast-chatgpt-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '09---2024-09-24-ep0-fsjam-podcast-claude-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --claude CLAUDE_3_SONNET',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-claude-shownotes.md',
    newName: '10---2024-09-24-ep0-fsjam-podcast-claude-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '11---2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --gemini GEMINI_1_5_FLASH',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md',
    newName: '12---2024-09-24-ep0-fsjam-podcast-gemini-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '13---2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md',
    newName: '14---2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '15---2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md',
    newName: '16---2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-octo-shownotes.md',
    newName: '17---2024-09-24-ep0-fsjam-podcast-octo-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --octo LLAMA_3_1_8B',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-octo-shownotes.md',
    newName: '18---2024-09-24-ep0-fsjam-podcast-octo-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '19---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '20---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --deepgram --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '21---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '22---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --assembly --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '23---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels',
    expectedFile: '2024-05-08-fsjam-short-prompt.md',
    newName: '24---2024-05-08-fsjam-short-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://ajc.pics/audio/fsjam-short.mp3" --assembly --speakerLabels --llama',
    expectedFile: '2024-05-08-fsjam-short-llama-shownotes.md',
    newName: '25---2024-05-08-fsjam-short-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --whisper tiny',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '26---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '27---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary shortChapters mediumChapters longChapters takeaways questions',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-prompt.md',
    newName: '28---2024-09-24-ep0-fsjam-podcast-prompt.md'
  },
  {
    cmd: 'npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --prompt titles summary shortChapters takeaways questions --whisper tiny --llama',
    expectedFile: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md',
    newName: '29---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --playlist "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr" --prompt titles --whisper tiny --llama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-llama-shownotes.md', newName: '30---2024-09-24-ep1-fsjam-podcast-llama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md', newName: '31---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --llama',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-llama-shownotes.md', newName: '32---2024-09-24-ep1-fsjam-podcast-llama-shownotes.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-llama-shownotes.md', newName: '33---2024-09-24-ep0-fsjam-podcast-llama-shownotes.md' }
    ]
  },
  {
    cmd: 'npm run as -- --file "content/audio.mp3" --prompt titles --whisper tiny --llama',
    expectedFile: 'audio-llama-shownotes.md',
    newName: '34---audio-llama-shownotes.md'
  },
  {
    cmd: 'npm run as -- --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '35---2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md'
  },
  {
    cmd: 'npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order newest --skip 94 --whisper tiny',
    expectedFile: '2020-10-27-episode-0-the-fullstack-jamstack-podcast-with-anthony-campolo-and-christopher-burns-prompt.md',
    newName: '36---2020-10-27-episode-0-the-fullstack-jamstack-podcast-with-anthony-campolo-and-christopher-burns-prompt.md'
  },
  {
    cmd: 'npm run as -- --rss "https://feeds.transistor.fm/fsjam-podcast/" --order oldest --skip 94 --whisper tiny',
    expectedFile: '2023-06-28-episode-94-clerk-with-james-perkins-prompt.md',
    newName: '37---2023-06-28-episode-94-clerk-with-james-perkins-prompt.md'
  }
]

test('Autoshow Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
          const filePath = path.join('content', file)
          assert.strictEqual(fs.existsSync(filePath), true, `Expected file ${file} was not created`)
          const newPath = path.join('content', newName)
          fs.renameSync(filePath, newPath)
          assert.strictEqual(fs.existsSync(newPath), true, `File was not renamed to ${newName}`)
        }
      } else {
        const filePath = path.join('content', command.expectedFile)
        assert.strictEqual(fs.existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = path.join('content', command.newName)
        fs.renameSync(filePath, newPath)
        assert.strictEqual(fs.existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})