// test/base.test.ts

import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { l } from '../src/utils.ts'
import { readdir, rename, join } from '../src/utils.ts'

interface RequestData {
  endpoint: string
  data: any
  outputFiles: string[]
}

interface ApiResponse {
  message?: string
}

export function runTestsForRequests(requests: RequestData[], label: string): void {
  describe(label, () => {
    requests.forEach((request: RequestData, index: number) => {
      it(`Request ${index + 1}`, async () => {
        const OUTPUT_DIR: string = 'content'
        const filesBefore: string[] = await readdir(OUTPUT_DIR)

        const response: Response = await fetch(request.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request.data)
        })

        l(`\nRequest ${index + 1} response status: ${response.status}`)

        if (!response.ok) {
          const errorText: string = await response.text()
          console.error('Error details:', errorText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        let result: ApiResponse | undefined
        try {
          result = await response.json() as ApiResponse
        } catch (parseErr: unknown) {
          const errorMessage = parseErr instanceof Error ? parseErr.message : String(parseErr)
          throw new Error(`Failed to parse JSON response: ${errorMessage}`)
        }

        l(`Request ${index + 1} result: ${result?.message}`)

        await new Promise<void>(resolve => setTimeout(resolve, 1000))

        const filesAfter: string[] = await readdir(OUTPUT_DIR)
        const newFiles: string[] = filesAfter.filter((f: string) => !filesBefore.includes(f))
        newFiles.sort()

        if (newFiles.length > 0) {
          for (let i = 0; i < newFiles.length; i++) {
            const oldFilePath: string = join(OUTPUT_DIR, newFiles[i])
            const newFileName: string = request.outputFiles[i] || `output_${Date.now()}_${i}.md`
            const newFilePath: string = join(OUTPUT_DIR, newFileName)
            try {
              await rename(oldFilePath, newFilePath)
              l(`\nFile renamed:\n  - Old: ${oldFilePath}\n  - New: ${newFilePath}`)
            } catch (renameError: unknown) {
              const errorMessage = renameError instanceof Error ? renameError.message : String(renameError)
              console.error(`Failed to rename file ${oldFilePath} to ${newFilePath}: ${errorMessage}`)
            }
          }
        } else {
          l('No new files to rename for this request.')
        }

        assert.equal(response.status, 200, 'Expected a 200 OK response')
      })
    })
  })
}