// test/models.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils.ts'

const FILE_EXAMPLE = 'content/examples/audio-prompt.md'
const AUDIO_FILE = 'content/examples/audio'
const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY
} = env

export const requests = [
  {
    data: {
      finalPath: AUDIO_FILE,
      transcriptServices: 'assembly',
      options: {
        assembly: 'best',
        assemblyApiKey: ASSEMBLY_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: ['01-assembly-best.md', '01-assembly-best.json'],
  },
  {
    data: {
      finalPath: AUDIO_FILE,
      transcriptServices: 'assembly',
      options: {
        assembly: 'nano',
        assemblyApiKey: ASSEMBLY_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: ['02-assembly-nano.md', '02-assembly-nano.json'],
  },
  {
    data: {
      finalPath: AUDIO_FILE,
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'nova-2',
        deepgramApiKey: DEEPGRAM_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: ['03-deepgram-nova-2.md', '03-deepgram-nova-2.json'],
  },
  {
    data: {
      finalPath: AUDIO_FILE,
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'base',
        deepgramApiKey: DEEPGRAM_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: ['04-deepgram-base.md', '04-deepgram-base.json'],
  },
  {
    data: {
      finalPath: AUDIO_FILE,
      transcriptServices: 'deepgram',
      options: {
        deepgram: 'enhanced',
        deepgramApiKey: DEEPGRAM_API_KEY
      }
    },
    endpoint: '/run-transcription',
    outputFiles: ['05-deepgram-enhanced.md', '05-deepgram-enhanced.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'gpt-4o',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['07-chatgpt-gpt-4o.md', '07-chatgpt-gpt-4o.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'gpt-4o-mini',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['08-chatgpt-gpt-4o-mini.md', '08-chatgpt-gpt-4o-mini.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'chatgpt',
      options: {
        chatgpt: 'o1-mini',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['09-chatgpt-o1-mini.md', '09-chatgpt-o1-mini.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'claude',
      options: {
        claude: 'claude-3-7-sonnet-latest',
        anthropicApiKey: ANTHROPIC_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['10-claude-3-7-sonnet-latest.md', '10-claude-3-7-sonnet-latest.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'claude',
      options: {
        claude: 'claude-3-5-haiku-latest',
        anthropicApiKey: ANTHROPIC_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['11-claude-3-5-haiku-latest.md', '11-claude-3-5-haiku-latest.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'claude',
      options: {
        claude: 'claude-3-opus-latest',
        anthropicApiKey: ANTHROPIC_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['12-claude-3-opus-latest.md', '12-claude-3-opus-latest.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-1.5-pro',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['15-gemini-1.5-pro.md', '15-gemini-1.5-pro.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-1.5-flash-8b',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['16-gemini-1.5-flash-8b.md', '16-gemini-1.5-flash-8b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-1.5-flash',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['17-gemini-1.5-flash.md', '17-gemini-1.5-flash.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-2.0-flash-lite',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['18-gemini-2.0-flash-lite.md', '18-gemini-2.0-flash-lite.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'gemini',
      options: {
        gemini: 'gemini-2.0-flash',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
  }
]

describe('Model Tests', () => {
  runTestsForRequests(requests, 'models.test.ts requests')
})