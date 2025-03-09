// test/cli/cli-channel.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  // {
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev"',
  //   expectedFile: '',
  //   newName: '06-CHANNEL-01-channel-default.md'
  // },
  // {
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --order oldest',
  //   expectedFile: '',
  //   newName: '06-CHANNEL-02-channel-oldest.md'
  // },
  // {
  //   cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --last 1',
  //   expectedFile: '',
  //   newName: '06-CHANNEL-03-channel-last-1.md'
  // },
  {
    cmd: 'npm run as -- --channel "https://www.youtube.com/@ajcwebdev" --info',
    expectedFile: 'channel_info.json',
    newName: '06-CHANNEL-04-channel_info.json'
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