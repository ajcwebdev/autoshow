// test/models.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils.ts'

const FILE_EXAMPLE = 'autoshow/content/examples/audio-prompt.md'
const AUDIO_FILE = 'autoshow/content/examples/audio'
const RUN_TRANSCRIPTION = 'http://localhost:4321/api/run-transcription'
const RUN_LLM = 'http://localhost:4321/api/run-llm'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  GROQ_API_KEY
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
    endpoint: RUN_TRANSCRIPTION,
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
    endpoint: RUN_TRANSCRIPTION,
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
    endpoint: RUN_TRANSCRIPTION,
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
    endpoint: RUN_TRANSCRIPTION,
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
    endpoint: RUN_TRANSCRIPTION,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
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
    endpoint: RUN_LLM,
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'groq',
      options: {
        groq: 'llama-3.3-70b-versatile',
        groqApiKey: GROQ_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['20-groq-llama-3.3-70b-versatile.md', '20-groq-llama-3.3-70b-versatile.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'groq',
      options: {
        groq: 'llama-3.1-8b-instant',
        groqApiKey: GROQ_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['21-groq-llama-3.1-8b-instant.md', '21-groq-llama-3.1-8b-instant.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'groq',
      options: {
        groq: 'llama3-70b-8192',
        groqApiKey: GROQ_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['22-groq-llama3-70b-8192.md', '22-groq-llama3-70b-8192.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'groq',
      options: {
        groq: 'llama3-8b-8192',
        groqApiKey: GROQ_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['23-groq-llama3-8b-8192.md', '23-groq-llama3-8b-8192.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'groq',
      options: {
        groq: 'gemma2-9b-it',
        groqApiKey: GROQ_API_KEY
      }
    },
    endpoint: RUN_LLM,
    outputFiles: ['24-groq-gemma2-9b-it.md', '24-groq-gemma2-9b-it.json'],
  }
]

describe('Model Tests', () => {
  runTestsForRequests(requests, 'models.test.ts requests')
})