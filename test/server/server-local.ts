// test/server/server-local.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../../src/utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

interface RequestData {
  type: 'file' | 'video';
  filePath?: string;
  url?: string;
  prompts?: string[];
  whisperModel?: string;
  transcriptServices?: string;
}

interface Request {
  data: RequestData;
  endpoint: string;
  outputFiles: string[];
}

const requests: Request[] = [
  // File Endpoint Requests
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
    },
    endpoint: '/api/process',
    outputFiles: ['01-file-default.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['02-file-whisper-tiny.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      transcriptServices: 'whisper',
      prompts: ['titles', 'summary'],
    },
    endpoint: '/api/process',
    outputFiles: ['03-file-prompts.md'],
  },
  // Video Endpoint Requests
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/api/process',
    outputFiles: ['04-video-default.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['05-video-whisper-tiny-prompts.md'],
  },
]

const fetchRequest = async (request: Request, index: number): Promise<void> => {
  try {
    // Get list of files before the request
    const filesBefore: string[] = await fs.readdir(OUTPUT_DIR)

    const response: Response = await fetch(`${BASE_URL}${request.endpoint}`, {
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
    const result: { message: string } = await response.json()
    l(`Request ${index + 1} result: ${result.message}`)

    // Wait briefly to ensure files are written
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get list of files after the request
    const filesAfter: string[] = await fs.readdir(OUTPUT_DIR)

    // Identify new files
    const newFiles: string[] = filesAfter.filter((f) => !filesBefore.includes(f))

    // Sort new files to ensure consistent ordering
    newFiles.sort()

    const outputFiles: string[] = request.outputFiles

    if (newFiles.length > 0) {
      for (let i = 0; i < newFiles.length; i++) {
        const oldFilePath: string = path.join(OUTPUT_DIR, newFiles[i]!)
        const newFileName: string = outputFiles[i] ?? `output_${i}.md`
        const newFilePath: string = path.join(OUTPUT_DIR, newFileName)
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
    const request = requests[i];
    if (request) {
      await fetchRequest(request, i);
    }
  }
}

runAllRequests()