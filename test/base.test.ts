// test/base.test.ts

import { describe, it, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import { l } from '../src/utils.ts'
import { readdir, rename, join, mkdirSync, existsSync, writeFileSync } from '../src/utils.ts'
import fs from 'node:fs/promises'

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
  retries?: number
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
        
        // Check if required files exist before test
        if (request.data.finalPath) {
          const wavPath = `${request.data.finalPath}.wav`
          l.info(`Checking if required file exists: ${wavPath}`)
          if (existsSync(wavPath)) {
            l.info(`File exists: ${wavPath}`)
          } else {
            // Create empty file for testing if it doesn't exist
            l.info(`Creating test file: ${wavPath}`)
            try {
              writeFileSync(wavPath, 'Test audio content', 'utf-8')
              l.info(`Created test file: ${wavPath}`)
            } catch (err) {
              l.dim(`Error creating test file: ${err}`)
            }
          }
        }
        
        const filesBefore = await readdir(TEST_DIR)
        l.info(`Files before test: ${filesBefore.length}`)
        
        const maxRetries = request.retries || 1
        let lastError: Error | null = null
        let responseBody: any = null
        let response: Response | null = null
        
        for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
          if (retryCount > 0) {
            l.info(`Retry attempt ${retryCount} for request ${index + 1}`)
          }
          
          try {
            const startTime = performance.now()
            response = await fetch(request.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(request.data)
            })
            const endTime = performance.now()
            const responseTime = endTime - startTime
            
            l.info(`Request ${index + 1} response status: ${response.status} (${responseTime.toFixed(2)}ms)`)
            
            try {
              responseBody = await response.json()
              l.info(`Response body: ${JSON.stringify(responseBody, null, 2)}`)
              
              if (!response.ok) {
                lastError = new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(responseBody)}`)
                l.dim(`Error response: ${JSON.stringify(responseBody, null, 2)}`)
                
                // Only retry if non-4xx error (4xx implies client error, which retrying won't fix)
                if (response.status < 400 || response.status >= 500) {
                  if (retryCount < maxRetries - 1) {
                    l.info(`Will retry due to server error status ${response.status}`)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    continue
                  }
                }
              } else {
                // Success! Break out of retry loop
                break
              }
            } catch (parseErr) {
              const textResponse = await response.text()
              l.dim(`Failed to parse JSON response: ${parseErr}`)
              l.dim(`Raw response: ${textResponse}`)
              lastError = new Error(`Failed to parse JSON response: ${parseErr}`)
              
              if (retryCount < maxRetries - 1) {
                l.info(`Will retry due to JSON parse error`)
                await new Promise(resolve => setTimeout(resolve, 2000))
                continue
              } else {
                throw lastError
              }
            }
          } catch (fetchErr) {
            l.dim(`Fetch error: ${fetchErr}`)
            lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr))
            
            if (retryCount < maxRetries - 1) {
              l.info(`Will retry due to fetch error: ${lastError.message}`)
              await new Promise(resolve => setTimeout(resolve, 2000))
              continue
            } else {
              throw lastError
            }
          }
        }
        
        // If we got here with an error and exhausted retries, throw the error
        if (lastError && !response?.ok) {
          throw lastError
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const filesAfter = await readdir(TEST_DIR)
        const newFiles = filesAfter.filter(f => !filesBefore.includes(f))
        l.info(`New files created: ${newFiles.join(', ') || 'none'}`)
        
        if (newFiles.length > 0 && request.outputFiles && request.outputFiles.length > 0) {
          newFiles.sort()
          const outputFilesCount = request.outputFiles.length
          for (let i = 0; i < Math.min(newFiles.length, outputFilesCount); i++) {
            const oldFilePath = join(TEST_DIR, newFiles[i])
            const newFilePath = join(TEST_DIR, request.outputFiles[i])
            await rename(oldFilePath, newFilePath)
            l.info(`Renamed file: ${oldFilePath} → ${newFilePath}`)
          }
        }
        
        assert.equal(response?.status, 200, `Expected 200 OK response but got ${response?.status}`)
        
        if (request.outputFiles && request.outputFiles.length > 0 && newFiles.length === 0) {
          l.info(`⚠️ No new files were created, but expected: ${request.outputFiles.join(', ')}`)
        }
      })
    })
  })
}