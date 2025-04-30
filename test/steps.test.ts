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

const AUDIO_FILE_PATH = 'autoshow/content/examples/audio.mp3'
const FINAL_PATH = 'autoshow/content/examples/audio'
const AUDIO_PROMPT = 'autoshow/content/examples/audio-prompt.md'
const CUSTOM_PROMPT = 'autoshow/content/examples/custom-prompt.md'
const VIDEO_URL = 'https://www.youtube.com/watch?v=MORMZXEaONk'
const DOWNLOAD_AUDIO = 'http://localhost:4321/api/download-audio'
const RUN_TRANSCRIPTION = 'http://localhost:4321/api/run-transcription'
const SELECT_PROMPT = 'http://localhost:4321/api/select-prompt'
const RUN_LLM = 'http://localhost:4321/api/run-llm'

const step2Requests = [
  {
    data: {
      type: 'video',
      url: VIDEO_URL,
      options: {
        video: VIDEO_URL
      }
    },
    endpoint: DOWNLOAD_AUDIO,
    outputFiles: ['01-youtube-audio.wav'],
    retries: 2
  },
  {
    data: {
      type: 'file',
      filePath: AUDIO_FILE_PATH,
      options: {
        file: AUDIO_FILE_PATH
      }
    },
    endpoint: DOWNLOAD_AUDIO,
    outputFiles: ['02-audio.wav'],
    retries: 2
  }
]

const step3Requests = [
  {
    data: {
      finalPath: FINAL_PATH,
      transcriptServices: 'assembly',
      options: {
        assembly: 'best',
        assemblyApiKey: ASSEMBLY_API_KEY
      }
    },
    endpoint: RUN_TRANSCRIPTION,
    outputFiles: ['03-assembly-best.md'],
    retries: 3
  },
  {
    data: {
      finalPath: FINAL_PATH,
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'nova-2',
        deepgramApiKey: DEEPGRAM_API_KEY,
        speakerLabels: true
      }
    },
    endpoint: RUN_TRANSCRIPTION,
    outputFiles: ['04-deepgram-nova-2.md'],
    retries: 3
  }
]

const step4Requests = [
  {
    data: {
      options: {
        prompt: ['summary','longChapters','quotes']
      }
    },
    endpoint: SELECT_PROMPT,
    outputFiles: ['05-summary-longChapters-quotes-prompt.md']
  },
  {
    data: {
      options: {
        customPrompt: CUSTOM_PROMPT
      }
    },
    endpoint: SELECT_PROMPT,
    outputFiles: ['06-custom-prompt.md']
  }
]

const step5Requests = [
  {
    data: {
      filePath: AUDIO_PROMPT,
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'gpt-4o-mini',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['07-gpt-4o-mini.md'],
    retries: 2
  },
  {
    data: {
      filePath: AUDIO_PROMPT,
      llmServices: 'claude',
      options: {
        claude: 'claude-3-opus-latest',
        anthropicApiKey: ANTHROPIC_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['08-claude-3-opus-latest.md'],
    retries: 2
  },
  {
    data: {
      filePath: AUDIO_PROMPT,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-1.5-flash-8b',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['09-gemini-1.5-flash-8b.md'],
    retries: 2
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