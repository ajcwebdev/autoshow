// src/server/fetch-all.ts

import fs from 'fs/promises'
import path from 'path'
import { l, err } from '../../../src/utils/logging'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const requests = [
  // Playlist Endpoint Requests
  {
    data: {
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
    },
    endpoint: '/process',
    outputFiles: ['FILE_01A.md', 'FILE_01B.md'],
  },
  {
    data: {
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_02A.md', 'FILE_02B.md'],
  },
  {
    data: {
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_03A.md', 'FILE_03B.md'],
  },
  {
    data: {
      type: 'playlist',
      url: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      prompts: ['titles', 'mediumChapters'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_04A.md', 'FILE_04B.md'],
  },
  // URLs Endpoint Requests
  {
    data: {
      type: 'urls',
      filePath: 'content/example-urls.md',
    },
    endpoint: '/process',
    outputFiles: ['FILE_05A.md', 'FILE_05B.md'],
  },
  {
    data: {
      type: 'urls',
      filePath: 'content/example-urls.md',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_06A.md', 'FILE_06B.md'],
  },
  {
    data: {
      type: 'urls',
      filePath: 'content/example-urls.md',
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_07A.md', 'FILE_07B.md'],
  },
  {
    data: {
      type: 'urls',
      filePath: 'content/example-urls.md',
      prompts: ['titles', 'mediumChapters'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_08A.md', 'FILE_08B.md'],
  },
  // File Endpoint Requests
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
    },
    endpoint: '/process',
    outputFiles: ['FILE_09.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_10.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_11.md'],
  },
  {
    data: {
      type: 'file',
      filePath: 'content/audio.mp3',
      prompts: ['titles'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_12.md'],
  },
  // RSS Endpoint Requests
  {
    data: {
      type: 'rss',
      url: 'https://ajcwebdev.substack.com/feed/',
    },
    endpoint: '/process',
    outputFiles: ['FILE_13.md'],
  },
  {
    data: {
      type: 'rss',
      url: 'https://ajcwebdev.substack.com/feed/',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_14.md'],
  },
  {
    data: {
      type: 'rss',
      url: 'https://ajcwebdev.substack.com/feed/',
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_15.md'],
  },
  {
    data: {
      type: 'rss',
      url: 'https://feeds.transistor.fm/fsjam-podcast/',
      whisperModel: 'tiny',
      order: 'newest',
      skip: 94,
    },
    endpoint: '/process',
    outputFiles: ['FILE_16.md'],
  },
  {
    data: {
      type: 'rss',
      url: 'https://feeds.transistor.fm/fsjam-podcast/',
      whisperModel: 'tiny',
      order: 'oldest',
      skip: 94,
    },
    endpoint: '/process',
    outputFiles: ['FILE_17.md'],
  },
  // Video Endpoint Requests
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/process',
    outputFiles: ['FILE_18.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_19.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
    },
    endpoint: '/process',
    outputFiles: ['FILE_20.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
      llmModel: 'GPT_4o_MINI',
    },
    endpoint: '/process',
    outputFiles: ['FILE_21.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
    },
    endpoint: '/process',
    outputFiles: ['FILE_22.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      llmModel: 'CLAUDE_3_SONNET',
    },
    endpoint: '/process',
    outputFiles: ['FILE_23.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
    },
    endpoint: '/process',
    outputFiles: ['FILE_24.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      llmModel: 'GEMINI_1_5_FLASH',
    },
    endpoint: '/process',
    outputFiles: ['FILE_25.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
    },
    endpoint: '/process',
    outputFiles: ['FILE_26.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
      llmModel: 'COMMAND_R_PLUS',
    },
    endpoint: '/process',
    outputFiles: ['FILE_27.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
    },
    endpoint: '/process',
    outputFiles: ['FILE_28.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
      llmModel: 'MIXTRAL_8x7b',
    },
    endpoint: '/process',
    outputFiles: ['FILE_29.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
    },
    endpoint: '/process',
    outputFiles: ['FILE_32.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
    },
    endpoint: '/process',
    outputFiles: ['FILE_33.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_34.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
    },
    endpoint: '/process',
    outputFiles: ['FILE_35.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_36.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
    },
    endpoint: '/process',
    outputFiles: ['FILE_37.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_38.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'mediumChapters'],
    },
    endpoint: '/process',
    outputFiles: ['FILE_39.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
    },
    endpoint: '/process',
    outputFiles: ['FILE_40.md'],
  },
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
      whisperModel: 'tiny',
      llm: 'ollama',
    },
    endpoint: '/process',
    outputFiles: ['FILE_41.md'],
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