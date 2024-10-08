// server/fetch.js

import fs from 'fs/promises'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = 'content'

const requests = [
  // Playlist Endpoint Requests
  {
    data: {
      playlistUrl: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
    },
    endpoint: '/playlist',
    outputFiles: ['FILE_01A.md', 'FILE_01B.md'],
  },
  {
    data: {
      playlistUrl: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      whisperModel: 'tiny',
    },
    endpoint: '/playlist',
    outputFiles: ['FILE_02A.md', 'FILE_02B.md'],
  },
  {
    data: {
      playlistUrl: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/playlist',
    outputFiles: ['FILE_03A.md', 'FILE_03B.md'],
  },
  {
    data: {
      playlistUrl: 'https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr',
      prompts: ['titles', 'mediumChapters'],
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/playlist',
    outputFiles: ['FILE_04A.md', 'FILE_04B.md'],
  },
  // URLs Endpoint Requests
  {
    data: {
      filePath: 'content/example-urls.md',
    },
    endpoint: '/urls',
    outputFiles: ['FILE_05A.md', 'FILE_05B.md'],
  },
  {
    data: {
      filePath: 'content/example-urls.md',
      whisperModel: 'tiny',
    },
    endpoint: '/urls',
    outputFiles: ['FILE_06A.md', 'FILE_06B.md'],
  },
  {
    data: {
      filePath: 'content/example-urls.md',
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/urls',
    outputFiles: ['FILE_07A.md', 'FILE_07B.md'],
  },
  {
    data: {
      filePath: 'content/example-urls.md',
      prompts: ['titles', 'mediumChapters'],
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/urls',
    outputFiles: ['FILE_08A.md', 'FILE_08B.md'],
  },
  // File Endpoint Requests
  {
    data: {
      filePath: 'content/audio.mp3',
    },
    endpoint: '/file',
    outputFiles: ['FILE_09.md'],
  },
  {
    data: {
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
    },
    endpoint: '/file',
    outputFiles: ['FILE_10.md'],
  },
  {
    data: {
      filePath: 'content/audio.mp3',
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/file',
    outputFiles: ['FILE_11.md'],
  },
  {
    data: {
      filePath: 'content/audio.mp3',
      prompts: ['titles'],
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/file',
    outputFiles: ['FILE_12.md'],
  },
  // RSS Endpoint Requests
  {
    data: {
      rssUrl: 'https://ajcwebdev.substack.com/feed/',
    },
    endpoint: '/rss',
    outputFiles: ['FILE_13.md'],
  },
  {
    data: {
      rssUrl: 'https://ajcwebdev.substack.com/feed/',
      whisperModel: 'tiny',
    },
    endpoint: '/rss',
    outputFiles: ['FILE_14.md'],
  },
  {
    data: {
      rssUrl: 'https://ajcwebdev.substack.com/feed/',
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/rss',
    outputFiles: ['FILE_15.md'],
  },
  {
    data: {
      rssUrl: 'https://feeds.transistor.fm/fsjam-podcast/',
      whisperModel: 'tiny',
      order: 'newest',
      skip: 94,
    },
    endpoint: '/rss',
    outputFiles: ['FILE_16.md'],
  },
  {
    data: {
      rssUrl: 'https://feeds.transistor.fm/fsjam-podcast/',
      whisperModel: 'tiny',
      order: 'oldest',
      skip: 94,
    },
    endpoint: '/rss',
    outputFiles: ['FILE_17.md'],
  },
  // Video Endpoint Requests
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
    },
    endpoint: '/video',
    outputFiles: ['FILE_18.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/video',
    outputFiles: ['FILE_19.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
    },
    endpoint: '/video',
    outputFiles: ['FILE_20.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'chatgpt',
      llmModel: 'GPT_4o_MINI',
    },
    endpoint: '/video',
    outputFiles: ['FILE_21.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
    },
    endpoint: '/video',
    outputFiles: ['FILE_22.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'claude',
      llmModel: 'CLAUDE_3_SONNET',
    },
    endpoint: '/video',
    outputFiles: ['FILE_23.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
    },
    endpoint: '/video',
    outputFiles: ['FILE_24.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'gemini',
      llmModel: 'GEMINI_1_5_FLASH',
    },
    endpoint: '/video',
    outputFiles: ['FILE_25.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
    },
    endpoint: '/video',
    outputFiles: ['FILE_26.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'cohere',
      llmModel: 'COMMAND_R_PLUS',
    },
    endpoint: '/video',
    outputFiles: ['FILE_27.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
    },
    endpoint: '/video',
    outputFiles: ['FILE_28.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'mistral',
      llmModel: 'MIXTRAL_8x7b',
    },
    endpoint: '/video',
    outputFiles: ['FILE_29.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'octo',
    },
    endpoint: '/video',
    outputFiles: ['FILE_30.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      llm: 'octo',
      llmModel: 'LLAMA_3_1_8B',
    },
    endpoint: '/video',
    outputFiles: ['FILE_31.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      whisperModel: 'tiny',
    },
    endpoint: '/video',
    outputFiles: ['FILE_32.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
    },
    endpoint: '/video',
    outputFiles: ['FILE_33.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'deepgram',
      llm: 'llama',
    },
    endpoint: '/video',
    outputFiles: ['FILE_34.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
    },
    endpoint: '/video',
    outputFiles: ['FILE_35.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      transcriptServices: 'assembly',
      llm: 'llama',
    },
    endpoint: '/video',
    outputFiles: ['FILE_36.md'],
  },
  {
    data: {
      youtubeUrl: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
    },
    endpoint: '/video',
    outputFiles: ['FILE_37.md'],
  },
  {
    data: {
      youtubeUrl: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      llm: 'llama',
    },
    endpoint: '/video',
    outputFiles: ['FILE_38.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'mediumChapters'],
    },
    endpoint: '/video',
    outputFiles: ['FILE_39.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
    },
    endpoint: '/video',
    outputFiles: ['FILE_40.md'],
  },
  {
    data: {
      youtubeUrl: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      prompts: ['titles', 'summary', 'shortChapters', 'takeaways', 'questions'],
      whisperModel: 'tiny',
      llm: 'llama',
    },
    endpoint: '/video',
    outputFiles: ['FILE_41.md'],
  },
]

const fetchRequest = async (request, index) => {
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
    console.log(`\nRequest ${index + 1} response status:`, response.status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    console.log(`Request ${index + 1} result: ${result.message}`)

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
        const oldFilePath = path.join(OUTPUT_DIR, newFiles[i])
        const newFileName = outputFiles[i]
        const newFilePath = path.join(OUTPUT_DIR, newFileName)
        await fs.rename(oldFilePath, newFilePath)
        console.log(`\nFile renamed:\n  - Old: ${oldFilePath}\n  - New: ${newFilePath}`)
      }
    } else {
      console.log('No new files to rename for this request.')
    }
  } catch (error) {
    console.error(`Error in request ${index + 1}:`, error)
  }
}

const runAllRequests = async () => {
  for (let i = 0; i < requests.length; i++) {
    await fetchRequest(requests[i], i)
  }
}

runAllRequests()