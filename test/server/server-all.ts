// test/server/server-all.ts

import fs from 'node:fs/promises'
import path from 'node:path'
import { l, err } from '../../src/utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

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
      whisperModel: 'tiny',
      llm: 'ollama',
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
      llm: 'ollama',
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
      llm: 'ollama',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_06.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_08.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_10.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_12.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_14.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_16.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'deepseek',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_17.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'grok',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_20.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      llm: 'ollama',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_21.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_22.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      llm: 'ollama',
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
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_24.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      llm: 'ollama',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_25.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'mediumChapters'],
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_26.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_27.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/api/process',
    outputFiles: ['FILE_28.md'],
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