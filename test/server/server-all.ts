// test/server/server-all.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../../src/utils/logging.ts'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
} = process.env

type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'fireworks' | 'together'
type TranscriptService = 'deepgram' | 'assembly' | 'whisper'

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  whisperModel?: string
  transcriptServices?: TranscriptService
  speakerLabels?: boolean
  llm?: LLMProvider
  llmModel?: string
  openaiApiKey?: string | undefined
  anthropicApiKey?: string | undefined
  geminiApiKey?: string | undefined
  deepseekApiKey?: string | undefined
  deepgramApiKey?: string | undefined
  assemblyApiKey?: string | undefined
  togetherApiKey?: string | undefined
  fireworksApiKey?: string | undefined
}

interface Request {
  data: RequestData
  endpoint: string
  outputFiles: string[]
}

const requests: Request[] = [
  // --- FILE ENDPOINT REQUESTS ---
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_01.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_02.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'whisper',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_03.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['titles'],
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_04.md'],
  },

  // --- VIDEO ENDPOINT REQUESTS ---
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_05.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_06.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_07.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_08.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_09.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_10.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_11.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_12.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_13.md'],
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
    outputFiles: ['FILE_14.md'],
  },
]

const fetchRequest = async (request: Request, index: number): Promise<void> => {
  try {
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

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const filesAfter: string[] = await fs.readdir(OUTPUT_DIR)
    const newFiles: string[] = filesAfter.filter((f) => !filesBefore.includes(f))
    newFiles.sort()

    const outputFiles = request.outputFiles

    if (newFiles.length > 0) {
      for (let i = 0; i < Math.min(newFiles.length, outputFiles.length); i++) {
        const oldFilePath = path.join(OUTPUT_DIR, newFiles[i]!)
        const newFileName = outputFiles[i]!
        const newFilePath = path.join(OUTPUT_DIR, newFileName)
        await fs.rename(oldFilePath, newFilePath)
        l(`File renamed: ${oldFilePath} --> ${newFilePath}`)
      }
    } else {
      l('No new files to rename for this request.')
    }
  } catch (error) {
    err(`Error in request ${index + 1}:`, error)
  }
}

const runAllRequests = async (): Promise<void> => {
  for (const [i, request] of requests.entries()) {
    await fetchRequest(request, i)
  }
}

runAllRequests()