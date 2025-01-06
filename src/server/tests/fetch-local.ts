// src/server/tests/fetch-local.ts

import fs from 'fs/promises'
import path from 'path'
import { l, err } from '../../utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const requests = [
  // Playlist Endpoint Requests
  {
    data: {
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_01.md', 'FILE_02.md'],
  },
  // URLs Endpoint Requests
  {
    data: {
      type: 'urls',
      filePath: 'content/example-urls.md',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_03.md', 'FILE_04.md'],
  },
  // File Endpoint Requests
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
    },
    endpoint: '/process',
    outputFiles: ['FILE_05.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_06.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_07.md'],
  },
  // RSS Endpoint Requests
  {
    data: {
      type: 'rss',
      url: 'https://ajcwebdev.substack.com/feed/',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_08.md'],
  },
  // Video Endpoint Requests
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/process',
    outputFiles: ['FILE_09.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_11.md'],
  },
]

const fetchRequest = async (request: any, index: number) => {
  try {
    // Get list of files before the request
    const filesBefore = await fs.readdir(OUTPUT_DIR)

    const response = await fetch(`${BASE_URL}${request.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.data),
    })
    l(`\nRequest ${index + 1} response status:`, response.status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    l(`Request ${index + 1} result: ${result.message}`)

    // Wait briefly to ensure files are written
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get list of files after the request
    const filesAfter = await fs.readdir(OUTPUT_DIR)

    // Identify new files
    const newFiles = filesAfter.filter((f) => !filesBefore.includes(f))

    // Sort new files to ensure consistent ordering
    newFiles.sort()

    const outputFiles = request.outputFiles

    if (newFiles.length > 0) {
      for (let i = 0; i < newFiles.length; i++) {
        const oldFilePath = path.join(OUTPUT_DIR, newFiles[i] as any)
        const newFileName = outputFiles[i]
        const newFilePath = path.join(OUTPUT_DIR, newFileName)
        await fs.rename(oldFilePath, newFilePath)
        l(`\nFile renamed:\n  - Old: ${oldFilePath}\n  - New: ${newFilePath}`)
      }
    } else {
      l('No new files to rename for this request.')
    }
  } catch (error) {
    err(`Error in request ${index + 1}:`, error)
  }
}

const runAllRequests = async () => {
  for (let i = 0; i < requests.length; i++) {
    await fetchRequest(requests[i], i)
  }
}

runAllRequests()