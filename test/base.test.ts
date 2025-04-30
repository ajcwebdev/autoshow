// test/base.test.ts

import { describe, it, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import { l } from '../src/utils.ts'
import { readdir, rename, join, mkdirSync, existsSync, writeFileSync } from '../src/utils.ts'
import fs from 'node:fs/promises'

// Setup test fixtures
const TEST_DIR = 'content'
const EXAMPLES_DIR = join(TEST_DIR, 'examples')

async function ensureTestDirectories() {
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true })
  }
  if (!existsSync(EXAMPLES_DIR)) {
    mkdirSync(EXAMPLES_DIR, { recursive: true })
  }
}

async function setupTestFiles() {
  await ensureTestDirectories()
  const audioTestFile = join(EXAMPLES_DIR, 'audio.mp3')
  if (!existsSync(audioTestFile)) {
    writeFileSync(audioTestFile, 'test audio file', 'utf-8')
  }
  const wavTestFile = join(TEST_DIR, '02-audio.wav')
  if (!existsSync(wavTestFile)) {
    writeFileSync(wavTestFile, 'test wav file data', 'utf-8')
  }
  const promptTestFile = join(EXAMPLES_DIR, 'audio-prompt.md')
  if (!existsSync(promptTestFile)) {
    writeFileSync(promptTestFile, `---
title: "Test Audio"
description: "Test Description"
publishDate: "2023-01-01"
---

Test prompt content

## Transcript

Test transcript content`, 'utf-8')
  }
  const customPromptFile = join(EXAMPLES_DIR, 'custom-prompt.md')
  if (!existsSync(customPromptFile)) {
    writeFileSync(customPromptFile, 'This is a custom prompt test', 'utf-8')
  }
}

async function cleanupTestArtifacts() {
  try {
    const files = await readdir(TEST_DIR)
    const testArtifacts = files.filter(file => 
      (file.startsWith('output_') || /^\d+-(.*)\.(md|wav|json)$/.test(file)) &&
      !file.includes('examples'))
    for (const file of testArtifacts) {
      await fs.unlink(join(TEST_DIR, file))
    }
  } catch (err) {
    l.dim(`Error cleaning up test artifacts: ${err}`)
  }
}

function formatRequestDetails(request: any, index: number) {
  return `
Request ${index + 1}:
  Endpoint: ${request.endpoint}
  Data: ${JSON.stringify(request.data, null, 2)}
  Expected outputs: ${request.outputFiles ? request.outputFiles.join(', ') : 'none'}
`
}

interface TestRequest {
  data: Record<string, any>
  endpoint: string
  outputFiles?: string[]
}

export function runTestsForRequests(requests: TestRequest[], label: string) {
  describe(label, () => {
    beforeEach(async () => {
      l.info(`Setting up test environment for "${label}"`)
      await setupTestFiles()
    })
    
    afterEach(async () => {
      l.info(`Cleaning up after "${label}" tests`)
      await cleanupTestArtifacts()
    })

    requests.forEach((request: TestRequest, index: number) => {
      it(`Request ${index + 1}`, async () => {
        l.info(formatRequestDetails(request, index))
        
        const filesBefore = await readdir(TEST_DIR)
        l.info(`Files before test: ${filesBefore.length}`)
        
        const startTime = performance.now()
        const response = await fetch(request.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request.data)
        })
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        l.info(`Request ${index + 1} response status: ${response.status} (${responseTime.toFixed(2)}ms)`)
        
        let responseBody
        try {
          responseBody = await response.json()
          l.info(`Response body: ${JSON.stringify(responseBody, null, 2)}`)
        } catch (parseErr) {
          const textResponse = await response.text()
          l.dim(`Failed to parse JSON response: ${parseErr}`)
          l.dim(`Raw response: ${textResponse}`)
          throw new Error(`Failed to parse JSON response: ${parseErr}`)
        }
        
        if (!response.ok) {
          l.dim(`Error response: ${JSON.stringify(responseBody, null, 2)}`)
          throw new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(responseBody)}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const filesAfter = await readdir(TEST_DIR)
        const newFiles = filesAfter.filter(f => !filesBefore.includes(f))
        
        l.info(`New files created: ${newFiles.join(', ') || 'none'}`)
        
        if (newFiles.length > 0 && request.outputFiles && request.outputFiles.length > 0) {
          newFiles.sort()
          
          // Ensure request.outputFiles is defined before using its length
          const outputFilesCount = request.outputFiles.length;
          for (let i = 0; i < Math.min(newFiles.length, outputFilesCount); i++) {
            const oldFilePath = join(TEST_DIR, newFiles[i])
            const newFilePath = join(TEST_DIR, request.outputFiles[i])
            await rename(oldFilePath, newFilePath)
            l.info(`Renamed file: ${oldFilePath} → ${newFilePath}`)
          }
        } // Close the if block for renaming files
        assert.equal(response.status, 200, `Expected 200 OK response but got ${response.status}`)

        if (request.outputFiles && request.outputFiles.length > 0 && newFiles.length === 0) {
          l.info(`⚠️ No new files were created, but expected: ${request.outputFiles.join(', ')}`)
        }
      })
    })
  })
}