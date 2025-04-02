// test/server-all.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../src/utils/logging.ts'
import { env } from '../src/utils/node-utils.ts'
import 'dotenv/config'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
} = env

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  whisperModel?: string
  transcriptServices?: string
  speakerLabels?: boolean
  llm?: string
  openaiApiKey?: string
  anthropicApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  deepgramApiKey?: string
  assemblyApiKey?: string
}

/**
 * Represents a single request configuration, including the endpoint
 * and the expected output file names that will be used for renaming new files.
 */
interface Request {
  data: RequestData
  endpoint: string
  outputFiles: string[]
}

const requests: Request[] = [
  // File Endpoint Requests
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
    },
    endpoint: '/api/process',
    outputFiles: ['01-file-default.md', `01-file-default.json`],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['02-file-whisper-tiny.md', `02-file-whisper-tiny.json`],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'whisper',
      prompts: ['titles', 'summary'],
    },
    endpoint: '/api/process',
    outputFiles: ['03-file-prompts.md', `03-file-prompts.json`],
  },
  // Video Endpoint Requests
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/api/process',
    outputFiles: ['04-video-default.md', '04-video-default.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['05-video-whisper-tiny-prompts.md', '05-video-whisper-tiny-prompts.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['06-video-chatgpt.md', '06-video-chatgpt.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['07-video-claude.md', '07-video-claude.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['08-video-gemini.md', '08-video-gemini.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['09-video-deepseek.md', '09-video-deepseek.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['10-video-deepgram.md', '10-video-deepgram.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['11-video-assembly.md', '11-video-assembly.json'],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['12-video-assembly-speakers.md', '12-video-assembly-speakers.json'],
  },
]

/**
 * Sends a POST request to the server with the provided data, checks for errors,
 * logs error details if the server returns a non-OK status, and renames new files
 * based on the output file names.
 * 
 * @param request - The request object containing data, endpoint, and output files
 * @param index - The index of the request in the sequence
 */
const fetchRequest = async (request: Request, index: number) => {
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

    // If the response is not ok, read the error text for better debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error details:', errorText)
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

/**
 * Iterates over all configured requests and executes them in sequence.
 */
const runAllRequests = async () => {
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]
    if (request) {
      await fetchRequest(request, i)
    }
  }
}

runAllRequests()