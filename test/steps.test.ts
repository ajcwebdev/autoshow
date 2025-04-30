// test/steps.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils.ts'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
} = env

const step2Requests = [
  {
    data: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=MORMZXEaONk',
      options: {
        video: 'https://www.youtube.com/watch?v=MORMZXEaONk'
      }
    },
    endpoint: 'http://localhost:4321/api/download-audio',
    outputFiles: ['01-youtube-audio.wav']
  },
  {
    data: {
      type: 'file',
      filePath: 'autoshow/content/examples/audio.mp3',
      options: {
        file: 'autoshow/content/examples/audio.mp3'
      }
    },
    endpoint: 'http://localhost:4321/api/download-audio',
    outputFiles: ['02-audio.wav']
  }
]

const step3Requests = [
  {
    data: {
      finalPath: 'autoshow/content/02-audio',
      transcriptServices: 'assembly',
      options: {
        assembly: 'best',
        assemblyApiKey: ASSEMBLY_API_KEY
      }
    },
    endpoint: 'http://localhost:4321/api/run-transcription',
    outputFiles: ['03-assembly-best.md']
  },
  {
    data: {
      finalPath: 'autoshow/content/02-audio',
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'nova-2',
        deepgramApiKey: DEEPGRAM_API_KEY,
        speakerLabels: true
      }
    },
    endpoint: 'http://localhost:4321/api/run-transcription',
    outputFiles: ['04-deepgram-nova-2.md']
  }
]

const step4Requests = [
  {
    data: {
      options: {
        prompt: ['summary','longChapters','quotes']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['05-summary-longChapters-quotes-prompt.md']
  },
  {
    data: {
      options: {
        customPrompt: 'autoshow/content/examples/custom-prompt.md'
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['06-custom-prompt.md']
  }
]

const step5Requests = [
  {
    data: {
      filePath: 'autoshow/content/examples/audio-prompt.md',
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'gpt-4o-mini',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['07-gpt-4o-mini.md'],
  },
  {
    data: {
      filePath: 'autoshow/content/examples/audio-prompt.md',
      llmServices: 'claude',
      options: {
        claude: 'claude-3-opus-latest',
        anthropicApiKey: ANTHROPIC_API_KEY
      }
    },
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['08-claude-3-opus-latest.md'],
  },
  {
    data: {
      filePath: 'autoshow/content/examples/audio-prompt.md',
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-1.5-flash-8b',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['09-gemini-1.5-flash-8b.md'],
  },
]

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