// test/server/docker-server-all.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../../src/utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const {
  DEEPGRAM_API_KEY, ASSEMBLY_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, COHERE_API_KEY, MISTRAL_API_KEY, GROK_API_KEY, DEEPSEEK_API_KEY,
  // TOGETHER_API_KEY, FIREWORKS_API_KEY, GROQ_API_KEY
} = process.env

const requests = [
  // File Endpoint Requests
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_01.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_02.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      transcriptionService: 'whisper',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_03.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      prompts: ['titles'],
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_04.md'],
  },
  // Video Endpoint Requests
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
      llm: 'chatgpt',
      llmModel: 'GPT_4o_MINI',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_08.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_09.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      llmModel: 'CLAUDE_3_SONNET',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_10.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_11.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      llmModel: 'GEMINI_1_5_FLASH',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_12.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
      cohereApiKey: COHERE_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_13.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
      llmModel: 'COMMAND_R_PLUS',
      cohereApiKey: COHERE_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_14.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
      mistralApiKey: MISTRAL_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_15.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
      llmModel: 'MIXTRAL_8x7b',
      mistralApiKey: MISTRAL_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_16.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_17.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'grok',
      grokApiKey: GROK_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_18.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_19.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_20.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    //   transcriptModel: '',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_21.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_22.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
      //   transcriptModel: '',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_23.md'],
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
    outputFiles: ['FILE_24.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_25.md'],
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