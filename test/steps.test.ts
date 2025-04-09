// test/steps.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils/node-utils.ts'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
} = env

const step1Requests = [
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk'
    },
    endpoint: '/generate-markdown',
    outputFiles: []
  },
  {
    data: {
      type: 'file',
      filePath: 'content/examples/audio.mp3'
    },
    endpoint: '/generate-markdown',
    outputFiles: []
  }
]

const step2Requests = [
  {
    data: {
      input: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      filename: 'ep0-fsjam-podcast',
      options: {
        video: 'https://www.youtube.com/watch?v=MORMZXEaONk'
      }
    },
    endpoint: '/download-audio',
    outputFiles: ['01-ep0-fsjam-podcast.wav']
  },
  {
    data: {
      input: 'content/examples/audio.mp3',
      filename: 'audio',
      options: {
        file: 'content/examples/audio.mp3'
      }
    },
    endpoint: '/download-audio',
    outputFiles: ['02-audio.wav']
  }
]

const step3Requests = [
  {
    data: {
      finalPath: 'content/02-audio',
      transcriptServices: 'assembly',
      options: {
        assembly: 'best',
        assemblyApiKey: ASSEMBLY_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: []
  },
  {
    data: {
      finalPath: 'content/02-audio',
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'nova-2',
        deepgramApiKey: DEEPGRAM_API_KEY,
        speakerLabels: true
      }
    },
    endpoint: '/run-transcription',
    outputFiles: []
  }
]

const step4Requests = [
  {
    data: {
      options: {
        prompt: ['summary','longChapters','quotes']
      }
    },
    endpoint: '/select-prompt',
    outputFiles: []
  },
  {
    data: {
      options: {
        customPrompt: 'content/examples/custom-prompt.md'
      }
    },
    endpoint: '/select-prompt',
    outputFiles: []
  }
]

const step5Requests = [
  {
    data: {
      filePath: 'content/examples/audio-prompt.md',
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'gpt-4o-mini',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['audio-prompt-chatgpt-shownotes.md']
  }
]

describe('Step 1 - Generate Markdown', () => {
  runTestsForRequests(step1Requests, 'step1Requests')
})

describe('Step 2 - Download Audio', () => {
  runTestsForRequests(step2Requests, 'step2Requests')
})

describe('Step 3 - Run Transcription', () => {
  runTestsForRequests(step3Requests, 'step3Requests')
})

describe('Step 4 - Select Prompt', () => {
  runTestsForRequests(step4Requests, 'step4Requests')
})

describe('Step 5 - Run LLM', () => {
  runTestsForRequests(step5Requests, 'step5Requests')
})