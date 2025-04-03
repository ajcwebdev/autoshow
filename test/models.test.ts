// test/server-models.ts

import { describe, it, before, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildFastify } from '../src/fastify.ts'
import { l } from '../src/utils/logging.ts'
import { env, readdir, rename, join } from '../src/utils/node-utils.ts'

const BASE_PATH = '/api/process'
const OUTPUT_DIR = 'content'
const FILE_EXAMPLE = 'content/examples/audio.mp3'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
  FIREWORKS_API_KEY,
  TOGETHER_API_KEY,
} = env

interface RequestData {
  type: 'file' | 'video'
  filePath?: string
  url?: string
  prompts?: string[]
  whisperModel?: string
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
  togetherApiKey?: string
  fireworksApiKey?: string
}

interface RequestConfig {
  data: RequestData
  endpoint: string
  outputFiles: string[]
}

const requests: RequestConfig[] = [
  // 1) Assembly (best)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'assembly',
      transcriptModel: 'best',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['01-assembly-best.md', '01-assembly-best.json'],
  },
  // 2) Assembly (nano)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'assembly',
      transcriptModel: 'nano',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['02-assembly-nano.md', '02-assembly-nano.json'],
  },
  // 3) Deepgram (nova-2)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'nova-2',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['03-deepgram-nova-2.md', '03-deepgram-nova-2.json'],
  },
  // 4) Deepgram (base)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'base',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['04-deepgram-base.md', '04-deepgram-base.json'],
  },
  // 5) Deepgram (enhanced)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'enhanced',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['05-deepgram-enhanced.md', '05-deepgram-enhanced.json'],
  },

  // 6) ChatGPT (gpt-4.5-preview)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4.5-preview',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['06-chatgpt-gpt-4.5-preview.md', '06-chatgpt-gpt-4.5-preview.json'],
  },
  // 7) ChatGPT (gpt-4o)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4o',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['07-chatgpt-gpt-4o.md', '07-chatgpt-gpt-4o.json'],
  },
  // 8) ChatGPT (gpt-4o-mini)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4o-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['08-chatgpt-gpt-4o-mini.md', '08-chatgpt-gpt-4o-mini.json'],
  },
  // 9) ChatGPT (o1-mini)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'o1-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['09-chatgpt-o1-mini.md', '09-chatgpt-o1-mini.json'],
  },

  // 10) Claude (claude-3-7-sonnet-latest)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-7-sonnet-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['10-claude-3-7-sonnet-latest.md', '10-claude-3-7-sonnet-latest.json'],
  },
  // 11) Claude (claude-3-5-haiku-latest)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-5-haiku-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['11-claude-3-5-haiku-latest.md', '11-claude-3-5-haiku-latest.json'],
  },
  // 12) Claude (claude-3-opus-latest)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-opus-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['12-claude-3-opus-latest.md', '12-claude-3-opus-latest.json'],
  },

  // 13) DeepSeek (deepseek-chat)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'deepseek',
      llmModel: 'deepseek-chat',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['13-deepseek-chat.md', '13-deepseek-chat.json'],
  },
  // 14) DeepSeek (deepseek-reasoner)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'deepseek',
      llmModel: 'deepseek-reasoner',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['14-deepseek-reasoner.md', '14-deepseek-reasoner.json'],
  },

  // 15) Gemini (gemini-1.5-pro)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-pro',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['15-gemini-1.5-pro.md', '15-gemini-1.5-pro.json'],
  },
  // 16) Gemini (gemini-1.5-flash-8b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash-8b',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['16-gemini-1.5-flash-8b.md', '16-gemini-1.5-flash-8b.json'],
  },
  // 17) Gemini (gemini-1.5-flash)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['17-gemini-1.5-flash.md', '17-gemini-1.5-flash.json'],
  },
  // 18) Gemini (gemini-2.0-flash-lite)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash-lite',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['18-gemini-2.0-flash-lite.md', '18-gemini-2.0-flash-lite.json'],
  },
  // 19) Gemini (gemini-2.0-flash)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
  },

  // 20) Fireworks (llama-v3p1-405b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['20-fireworks-llama-v3p1-405b.md', '20-fireworks-llama-v3p1-405b.json'],
  },
  // 21) Fireworks (llama-v3p1-70b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['21-fireworks-llama-v3p1-70b.md', '21-fireworks-llama-v3p1-70b.json'],
  },
  // 22) Fireworks (llama-v3p1-8b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['22-fireworks-llama-v3p1-8b.md', '22-fireworks-llama-v3p1-8b.json'],
  },
  // 23) Fireworks (qwen2p5-72b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/qwen2p5-72b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['23-fireworks-qwen2p5-72b.md', '23-fireworks-qwen2p5-72b.json'],
  },

  // 24) Together (llama-3.2-3b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['24-together-llama-3.2-3b.md', '24-together-llama-3.2-3b.json'],
  },
  // 25) Together (llama-3.1-405b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['25-together-llama-3.1-405b.md', '25-together-llama-3.1-405b.json'],
  },
  // 26) Together (llama-3.1-70b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['26-together-llama-3.1-70b.md', '26-together-llama-3.1-70b.json'],
  },
  // 27) Together (llama-3.1-8b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['27-together-llama-3.1-8b.md', '27-together-llama-3.1-8b.json'],
  },
  // 28) Together (gemma-2-27b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'google/gemma-2-27b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['28-together-gemma-2-27b.md', '28-together-gemma-2-27b.json'],
  },
  // 29) Together (gemma-2-9b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'google/gemma-2-9b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['29-together-gemma-2-9b.md', '29-together-gemma-2-9b.json'],
  },
  // 30) Together (qwen2.5-72b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['30-together-qwen2.5-72b.md', '30-together-qwen2.5-72b.json'],
  },
  // 31) Together (qwen2.5-7b)
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['31-together-qwen2.5-7b.md', '31-together-qwen2.5-7b.json'],
  },
]

describe('POST /api/process Tests', () => {
  let app

  before(async () => {
    app = buildFastify()
    // await app.listen({ port: 3000, host: '0.0.0.0' })
  })

  after(async () => {
    await app.close()
  })

  requests.forEach((request, index) => {
    it(`Request ${index + 1}`, async () => {
      const filesBefore = await readdir(OUTPUT_DIR)

      const response = await app.inject({
        method: 'POST',
        url: request.endpoint,
        headers: {
          'Content-Type': 'application/json'
        },
        payload: request.data
      })

      l(`\nRequest ${index + 1} response status: ${response.statusCode}`)
      if (response.statusCode < 200 || response.statusCode >= 300) {
        const errorText = response.body
        console.error('Error details:', errorText)
        throw new Error(`HTTP error! status: ${response.statusCode}`)
      }

      let result
      try {
        result = JSON.parse(response.body) as { message?: string }
      } catch (parseErr) {
        throw new Error(`Failed to parse JSON response: ${parseErr}`)
      }

      l(`Request ${index + 1} result: ${result?.message}`)

      await new Promise(resolve => setTimeout(resolve, 1000))

      const filesAfter = await readdir(OUTPUT_DIR)
      const newFiles = filesAfter.filter(f => !filesBefore.includes(f))
      newFiles.sort()

      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          const oldFilePath = join(OUTPUT_DIR, newFiles[i])
          const newFileName = request.outputFiles[i] || `output_${i}.md`
          const newFilePath = join(OUTPUT_DIR, newFileName)
          await rename(oldFilePath, newFilePath)
          l(`\nFile renamed:\n  - Old: ${oldFilePath}\n  - New: ${newFilePath}`)
        }
      } else {
        l('No new files to rename for this request.')
      }

      assert.equal(response.statusCode, 200, 'Expected a 200 OK response')
    })
  })
})