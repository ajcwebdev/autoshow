// test/cli/cli-channel.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  // {
  //   // 1) Process a YouTube channel with default settings.
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev"',
  //   expectedFile: '',
  //   newName: '01-channel-default.md'
  // },
  // {
  //   // 2) Process the channel with oldest ordering.
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --order oldest',
  //   expectedFile: '',
  //   newName: '02-channel-oldest.md'
  // },
  // {
  //   // 3) Process the channel, getting only the last 1 video.
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --last 1',
  //   expectedFile: '',
  //   newName: '03-channel-last-1.md'
  // },
  {
    // 4) Download channel metadata (JSON) only.
    cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --info',
    expectedFile: 'channel_info.json',
    newName: '04-channel_info.json'
  },
]

test('AutoShow Channel Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Execute the CLI command
      execSync(command.cmd, { stdio: 'inherit' })

      // Check either a single file or an array of files
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