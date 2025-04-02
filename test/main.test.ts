// test/main.test.ts

import { describe, it, before, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildFastify } from '../src/fastify.ts'
import { l } from '../src/utils/logging.ts'
import { env, readdir, rename, join } from '../src/utils/node-utils.ts'

const BASE_PATH = '/api/process'
const OUTPUT_DIR = 'content'
const FILE_EXAMPLE = 'content/examples/audio.mp3'
const VIDEO_EXAMPLE = 'https://www.youtube.com/watch?v=MORMZXEaONk'

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
  llm?: string
  openaiApiKey?: string
  anthropicApiKey?: string
  geminiApiKey?: string
  deepseekApiKey?: string
  deepgramApiKey?: string
  assemblyApiKey?: string
  speakerLabels?: boolean
}

interface RequestConfig {
  data: RequestData
  endpoint: string
  outputFiles: string[]
}

const requests: RequestConfig[] = [
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '01-file-default.md',
      '01-file-default.json'
    ],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      whisperModel: 'tiny',
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '02-file-whisper-tiny.md',
      '02-file-whisper-tiny.json'
    ],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'whisper',
      prompts: ['titles', 'summary'],
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '03-file-prompts.md',
      '03-file-prompts.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '04-video-default.md',
      '04-video-default.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '05-video-whisper-tiny-prompts.md',
      '05-video-whisper-tiny-prompts.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'chatgpt',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '06-video-chatgpt.md',
      '06-video-chatgpt.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'claude',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '07-video-claude.md',
      '07-video-claude.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'gemini',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '08-video-gemini.md',
      '08-video-gemini.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '09-video-deepseek.md',
      '09-video-deepseek.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '10-video-deepgram.md',
      '11-video-deepgram.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '11-video-assembly.md',
      '11-video-assembly.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '12-video-assembly-speakers.md',
      '12-video-assembly-speakers.json'
    ],
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