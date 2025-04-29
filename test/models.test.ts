// test/models.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils/node-utils.ts'

const FILE_EXAMPLE = 'content/examples/audio-prompt.md'
const AUDIO_FILE = 'content/examples/audio'
const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  FIREWORKS_API_KEY,
  TOGETHER_API_KEY,
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
        llmModel: 'gpt-4.5-preview',
        openaiApiKey: OPENAI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['06-chatgpt-gpt-4.5-preview.md', '06-chatgpt-gpt-4.5-preview.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'chatgpt',
      options: {
        llmModel: 'gpt-4o',
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
        llmModel: 'gpt-4o-mini',
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
        llmModel: 'o1-mini',
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
        llmModel: 'claude-3-7-sonnet-latest',
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
        llmModel: 'claude-3-5-haiku-latest',
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
        llmModel: 'claude-3-opus-latest',
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
        llmModel: 'gemini-1.5-pro',
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
        llmModel: 'gemini-1.5-flash-8b',
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
        llmModel: 'gemini-1.5-flash',
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
        llmModel: 'gemini-2.0-flash-lite',
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
        llmModel: 'gemini-2.0-flash',
        geminiApiKey: GEMINI_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'fireworks',
      options: {
        llmModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
        fireworksApiKey: FIREWORKS_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['20-fireworks-llama-v3p1-405b.md', '20-fireworks-llama-v3p1-405b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'fireworks',
      options: {
        llmModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        fireworksApiKey: FIREWORKS_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['21-fireworks-llama-v3p1-70b.md', '21-fireworks-llama-v3p1-70b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'fireworks',
      options: {
        llmModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        fireworksApiKey: FIREWORKS_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['22-fireworks-llama-v3p1-8b.md', '22-fireworks-llama-v3p1-8b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'fireworks',
      options: {
        llmModel: 'accounts/fireworks/models/qwen2p5-72b-instruct',
        fireworksApiKey: FIREWORKS_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['23-fireworks-qwen2p5-72b.md', '23-fireworks-qwen2p5-72b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['24-together-llama-3.2-3b.md', '24-together-llama-3.2-3b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['25-together-llama-3.1-405b.md', '25-together-llama-3.1-405b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['26-together-llama-3.1-70b.md', '26-together-llama-3.1-70b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['27-together-llama-3.1-8b.md', '27-together-llama-3.1-8b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'google/gemma-2-27b-it',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['28-together-gemma-2-27b.md', '28-together-gemma-2-27b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'google/gemma-2-9b-it',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['29-together-gemma-2-9b.md', '29-together-gemma-2-9b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['30-together-qwen2.5-72b.md', '30-together-qwen2.5-72b.json'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: 'together',
      options: {
        llmModel: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
        togetherApiKey: TOGETHER_API_KEY
      }
    },
    endpoint: '/run-llm',
    outputFiles: ['31-together-qwen2.5-7b.md', '31-together-qwen2.5-7b.json'],
  },
]

describe('Model Tests', () => {
  runTestsForRequests(requests, 'models.test.ts requests')
})