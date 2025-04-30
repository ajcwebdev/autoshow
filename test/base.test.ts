// test/base.test.ts

import { describe, it, before, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildFastify } from '../src/fastify.ts'
import { l } from '../src/utils.ts'
import { readdir, rename, join } from '../src/utils.ts'

export function runTestsForRequests(requests, label) {
  describe(label, () => {
    let app
    before(async () => {
      app = buildFastify()
    })
    after(async () => {
      await app.close()
    })
    requests.forEach((request, index) => {
      it(`Request ${index + 1}`, async () => {
        const OUTPUT_DIR = 'content'
        const filesBefore = await readdir(OUTPUT_DIR)
        const response = await app.inject({
          method: 'POST',
          url: request.endpoint,
          headers: {
            'Content-Type': 'application/json'
          },
          payload: request.data
        })
        l(`\nRequest ${index + 1} response status: ${response.statusCode}`)
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const errorText = response.body
          console.error('Error details:', errorText)
          throw new Error(`HTTP error! status: ${response.statusCode}`)
        }
        let result
        try {
          result = JSON.parse(response.body)
        } catch (parseErr) {
          throw new Error(`Failed to parse JSON response: ${parseErr}`)
        }
        l(`Request ${index + 1} result: ${result?.message}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const filesAfter = await readdir(OUTPUT_DIR)
        const newFiles = filesAfter.filter(f => !filesBefore.includes(f))
        newFiles.sort()
        if (newFiles.length > 0) {
          for (let i = 0; i < newFiles.length; i++) {
            const oldFilePath = join(OUTPUT_DIR, newFiles[i])
            const newFileName = request.outputFiles[i] || `output_${i}.md`
            const newFilePath = join(OUTPUT_DIR, newFileName)
            await rename(oldFilePath, newFilePath)
            l(`\nFile renamed:\n  - Old: ${oldFilePath}\n  - New: ${newFilePath}`)
          }
        } else {
          l('No new files to rename for this request.')
        }
        assert.equal(response.statusCode, 200, 'Expected a 200 OK response')
      })
    })
  })
}