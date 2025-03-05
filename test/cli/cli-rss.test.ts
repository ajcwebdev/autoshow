// test/cli/cli-rss.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '01-substack-default.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --item "https://api.substack.com/feed/podcast/36236609/fd1f1532d9842fe1178de1c920442541.mp3"',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '02-substack-item.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --order oldest',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '03-substack-oldest.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --last 1',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '04-substack-last-1.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --lastDays 9999',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '05-substack-lastDays-9999.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --date 2021-05-10',
    expectedFile: '2021-05-10-thoughts-on-lambda-school-layoffs-prompt.md',
    newName: '06-substack-date-2021-05-10.md'
  },
  {
    cmd: 'npm run as -- --whisper tiny --rss "https://ajcwebdev.substack.com/feed" --info',
    expectedFile: 'ajcwebdev_info.json',
    newName: '07-ajcwebdev_info.json'
  },
]

test('AutoShow RSS Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Execute the CLI command
      execSync(command.cmd, { stdio: 'inherit' })

      // Verify that the file was created and rename it
      const filePath = join('content', command.expectedFile)
      strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)

      const newPath = join('content', command.newName)
      renameSync(filePath, newPath)
      strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
    })
  }
})