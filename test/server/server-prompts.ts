// test/server/server-prompts.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../../src/utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const { DEEPSEEK_API_KEY } = process.env

type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'fireworks' | 'together'

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  whisperModel?: string
  transcriptServices?: string
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
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['titles'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['01-titles.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['summary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['02-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['shortSummary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['03-short-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['longSummary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['04-long-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['bulletPoints'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['05-bullet-points.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['quotes'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['06-quotes.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['chapterTitlesAndQuotes'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['07-chapter-titles-quotes.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['x'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['08-social-x.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['facebook'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['09-social-facebook.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['linkedin'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['10-social-linkedin.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['chapterTitles'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['11-chapter-titles.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['shortChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['12-short-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['mediumChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['13-medium-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['longChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['14-long-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['takeaways'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['15-takeaways.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['questions'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['16-questions.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['faq'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['17-faq.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['blog'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['18-blog.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['rapSong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['19-rap-song.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['rockSong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['20-rock-song.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      prompts: ['countrySong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['21-country-song.md'],
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