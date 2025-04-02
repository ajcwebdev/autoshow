// test/server-models.ts

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
  FIREWORKS_API_KEY,
  TOGETHER_API_KEY
} = env

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  transcriptModel?: string
  transcriptServices?: string
  speakerLabels?: boolean
  llm?: string
  llmModel?: string
  openaiApiKey?: string
  anthropicApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  deepgramApiKey?: string
  assemblyApiKey?: string
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
    outputFiles: ['01-assembly-best.md', '01-assembly-best.json'],
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
    outputFiles: ['02-assembly-nano.md', '02-assembly-nano.json'],
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
    outputFiles: ['03-deepgram-nova-2.md', '03-deepgram-nova-2.json'],
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
    outputFiles: ['04-deepgram-base.md', '04-deepgram-base.json'],
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
    outputFiles: ['05-deepgram-enhanced.md', '05-deepgram-enhanced.json'],
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
    outputFiles: ['06-chatgpt-gpt-4.5-preview.md', '06-chatgpt-gpt-4.5-preview.json'],
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
    outputFiles: ['07-chatgpt-gpt-4o.md', '07-chatgpt-gpt-4o.json'],
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
    outputFiles: ['08-chatgpt-gpt-4o-mini.md', '08-chatgpt-gpt-4o-mini.json'],
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
    outputFiles: ['09-chatgpt-o1-mini.md', '09-chatgpt-o1-mini.json'],
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
    outputFiles: ['10-claude-3-7-sonnet-latest.md', '10-claude-3-7-sonnet-latest.json'],
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
    outputFiles: ['11-claude-3-5-haiku-latest.md', '11-claude-3-5-haiku-latest.json'],
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
    outputFiles: ['12-claude-3-opus-latest.md', '12-claude-3-opus-latest.json'],
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
    outputFiles: ['13-deepseek-chat.md', '13-deepseek-chat.json'],
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
    outputFiles: ['14-deepseek-reasoner.md', '14-deepseek-reasoner.json'],
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
    outputFiles: ['15-gemini-1.5-pro.md', '15-gemini-1.5-pro.json'],
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
    outputFiles: ['16-gemini-1.5-flash-8b.md', '16-gemini-1.5-flash-8b.json'],
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
    outputFiles: ['17-gemini-1.5-flash.md', '17-gemini-1.5-flash.json'],
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
    outputFiles: ['18-gemini-2.0-flash-lite.md', '18-gemini-2.0-flash-lite.json'],
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
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
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
    outputFiles: ['20-fireworks-llama-v3p1-405b.md', '20-fireworks-llama-v3p1-405b.json'],
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
    outputFiles: ['21-fireworks-llama-v3p1-70b.md', '21-fireworks-llama-v3p1-70b.json'],
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
    outputFiles: ['22-fireworks-llama-v3p1-8b.md', '22-fireworks-llama-v3p1-8b.json'],
  },
  // 23) Fireworks (qwen2p5-72b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/qwen2p5-72b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['23-fireworks-qwen2p5-72b.md', '23-fireworks-qwen2p5-72b.json'],
  },

  // 24) Together (llama-3.2-3b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['24-together-llama-3.2-3b.md', '24-together-llama-3.2-3b.json'],
  },
  // 25) Together (llama-3.1-405b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['25-together-llama-3.1-405b.md', '25-together-llama-3.1-405b.json'],
  },
  // 26) Together (llama-3.1-70b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['26-together-llama-3.1-70b.md', '26-together-llama-3.1-70b.json'],
  },
  // 27) Together (llama-3.1-8b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['27-together-llama-3.1-8b.md', '27-together-llama-3.1-8b.json'],
  },
  // 28) Together (gemma-2-27b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'google/gemma-2-27b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['28-together-gemma-2-27b.md', '28-together-gemma-2-27b.json'],
  },
  // 29) Together (gemma-2-9b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'google/gemma-2-9b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['29-together-gemma-2-9b.md', '29-together-gemma-2-9b.json'],
  },
  // 30) Together (qwen2.5-72b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['30-together-qwen2.5-72b.md', '30-together-qwen2.5-72b.json'],
  },
  // 31) Together (qwen2.5-7b)
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3',
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['31-together-qwen2.5-7b.md', '31-together-qwen2.5-7b.json'],
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