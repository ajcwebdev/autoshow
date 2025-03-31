// test/server/server-models.ts

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
  FIREWORKS_API_KEY,
  TOGETHER_API_KEY
} = process.env

type LLMProvider = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'fireworks' | 'together'

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  transcriptModel?: string
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
  // 1) Assembly (best)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'assembly',
      transcriptModel: 'best',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['01-assembly-best.md'],
  },
  // 2) Assembly (nano)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'assembly',
      transcriptModel: 'nano',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['02-assembly-nano.md'],
  },
  // 3) Deepgram (nova-2)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'deepgram',
      transcriptModel: 'nova-2',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['03-deepgram-nova-2.md'],
  },
  // 4) Deepgram (base)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'deepgram',
      transcriptModel: 'base',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['04-deepgram-base.md'],
  },
  // 5) Deepgram (enhanced)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      transcriptServices: 'deepgram',
      transcriptModel: 'enhanced',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['05-deepgram-enhanced.md'],
  },

  // 6) ChatGPT (gpt-4.5-preview)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'chatgpt',
      llmModel: 'gpt-4.5-preview',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['06-chatgpt-gpt-4.5-preview.md'],
  },
  // 7) ChatGPT (gpt-4o)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'chatgpt',
      llmModel: 'gpt-4o',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['07-chatgpt-gpt-4o.md'],
  },
  // 8) ChatGPT (gpt-4o-mini)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'chatgpt',
      llmModel: 'gpt-4o-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['08-chatgpt-gpt-4o-mini.md'],
  },
  // 9) ChatGPT (o1-mini)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'chatgpt',
      llmModel: 'o1-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['09-chatgpt-o1-mini.md'],
  },

  // 10) Claude (claude-3-7-sonnet-latest)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'claude',
      llmModel: 'claude-3-7-sonnet-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['10-claude-3-7-sonnet-latest.md'],
  },
  // 11) Claude (claude-3-5-haiku-latest)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'claude',
      llmModel: 'claude-3-5-haiku-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['11-claude-3-5-haiku-latest.md'],
  },
  // 12) Claude (claude-3-opus-latest)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'claude',
      llmModel: 'claude-3-opus-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['12-claude-3-opus-latest.md'],
  },

  // 13) DeepSeek (deepseek-chat)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'deepseek',
      llmModel: 'deepseek-chat',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['13-deepseek-chat.md'],
  },
  // 14) DeepSeek (deepseek-reasoner)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'deepseek',
      llmModel: 'deepseek-reasoner',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['14-deepseek-reasoner.md'],
  },

  // 15) Gemini (gemini-1.5-pro)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'gemini',
      llmModel: 'gemini-1.5-pro',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['15-gemini-1.5-pro.md'],
  },
  // 16) Gemini (gemini-1.5-flash-8b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash-8b',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['16-gemini-1.5-flash-8b.md'],
  },
  // 17) Gemini (gemini-1.5-flash)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['17-gemini-1.5-flash.md'],
  },
  // 18) Gemini (gemini-2.0-flash-lite)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash-lite',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['18-gemini-2.0-flash-lite.md'],
  },
  // 19) Gemini (gemini-2.0-flash)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['19-gemini-2.0-flash.md'],
  },

  // 20) Fireworks (llama-v3p1-405b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['20-fireworks-llama-v3p1-405b.md'],
  },
  // 21) Fireworks (llama-v3p1-70b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['21-fireworks-llama-v3p1-70b.md'],
  },
  // 22) Fireworks (llama-v3p1-8b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['22-fireworks-llama-v3p1-8b.md'],
  },
  // 23) Fireworks (llama-v3p2-3b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p2-3b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['23-fireworks-llama-v3p2-3b.md'],
  },
  // 24) Fireworks (qwen2p5-72b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/qwen2p5-72b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['24-fireworks-qwen2p5-72b.md'],
  },

  // 25) Together (llama-3.2-3b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['25-together-llama-3.2-3b.md'],
  },
  // 26) Together (llama-3.1-405b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['26-together-llama-3.1-405b.md'],
  },
  // 27) Together (llama-3.1-70b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['27-together-llama-3.1-70b.md'],
  },
  // 28) Together (llama-3.1-8b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['28-together-llama-3.1-8b.md'],
  },
  // 29) Together (gemma-2-27b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'google/gemma-2-27b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['29-together-gemma-2-27b.md'],
  },
  // 30) Together (gemma-2-9b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'google/gemma-2-9b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['30-together-gemma-2-9b.md'],
  },
  // 31) Together (qwen2.5-72b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['31-together-qwen2.5-72b.md'],
  },
  // 32) Together (qwen2.5-7b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['32-together-qwen2.5-7b.md'],
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