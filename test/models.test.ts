// test/server-models.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils/node-utils.ts'

const BASE_PATH = '/api/process'
const FILE_EXAMPLE = 'content/examples/audio.mp3'
const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
  FIREWORKS_API_KEY,
  TOGETHER_API_KEY,
} = env

export const requests = [
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'assembly',
      transcriptModel: 'best',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['01-assembly-best.md', '01-assembly-best.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'assembly',
      transcriptModel: 'nano',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['02-assembly-nano.md', '02-assembly-nano.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'nova-2',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['03-deepgram-nova-2.md', '03-deepgram-nova-2.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'base',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['04-deepgram-base.md', '04-deepgram-base.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'deepgram',
      transcriptModel: 'enhanced',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['05-deepgram-enhanced.md', '05-deepgram-enhanced.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4.5-preview',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['06-chatgpt-gpt-4.5-preview.md', '06-chatgpt-gpt-4.5-preview.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4o',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['07-chatgpt-gpt-4o.md', '07-chatgpt-gpt-4o.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'gpt-4o-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['08-chatgpt-gpt-4o-mini.md', '08-chatgpt-gpt-4o-mini.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'chatgpt',
      llmModel: 'o1-mini',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['09-chatgpt-o1-mini.md', '09-chatgpt-o1-mini.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-7-sonnet-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['10-claude-3-7-sonnet-latest.md', '10-claude-3-7-sonnet-latest.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-5-haiku-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['11-claude-3-5-haiku-latest.md', '11-claude-3-5-haiku-latest.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'claude',
      llmModel: 'claude-3-opus-latest',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['12-claude-3-opus-latest.md', '12-claude-3-opus-latest.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'deepseek',
      llmModel: 'deepseek-chat',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['13-deepseek-chat.md', '13-deepseek-chat.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'deepseek',
      llmModel: 'deepseek-reasoner',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['14-deepseek-reasoner.md', '14-deepseek-reasoner.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-pro',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['15-gemini-1.5-pro.md', '15-gemini-1.5-pro.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash-8b',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['16-gemini-1.5-flash-8b.md', '16-gemini-1.5-flash-8b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-1.5-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['17-gemini-1.5-flash.md', '17-gemini-1.5-flash.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash-lite',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['18-gemini-2.0-flash-lite.md', '18-gemini-2.0-flash-lite.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'gemini',
      llmModel: 'gemini-2.0-flash',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['19-gemini-2.0-flash.md', '19-gemini-2.0-flash.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['20-fireworks-llama-v3p1-405b.md', '20-fireworks-llama-v3p1-405b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['21-fireworks-llama-v3p1-70b.md', '21-fireworks-llama-v3p1-70b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['22-fireworks-llama-v3p1-8b.md', '22-fireworks-llama-v3p1-8b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'fireworks',
      llmModel: 'accounts/fireworks/models/qwen2p5-72b-instruct',
      fireworksApiKey: FIREWORKS_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['23-fireworks-qwen2p5-72b.md', '23-fireworks-qwen2p5-72b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['24-together-llama-3.2-3b.md', '24-together-llama-3.2-3b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['25-together-llama-3.1-405b.md', '25-together-llama-3.1-405b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['26-together-llama-3.1-70b.md', '26-together-llama-3.1-70b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['27-together-llama-3.1-8b.md', '27-together-llama-3.1-8b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'google/gemma-2-27b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['28-together-gemma-2-27b.md', '28-together-gemma-2-27b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'google/gemma-2-9b-it',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['29-together-gemma-2-9b.md', '29-together-gemma-2-9b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['30-together-qwen2.5-72b.md', '30-together-qwen2.5-72b.json'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      llm: 'together',
      llmModel: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      togetherApiKey: TOGETHER_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['31-together-qwen2.5-7b.md', '31-together-qwen2.5-7b.json'],
  },
]

describe('Model Tests', () => {
  runTestsForRequests(requests, 'models.test.ts requests')
})