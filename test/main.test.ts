// test/main.test.ts

import { env } from '../src/utils/node-utils.ts'

const BASE_PATH = '/api/process'
const FILE_EXAMPLE = 'content/examples/audio.mp3'
const VIDEO_EXAMPLE = 'https://www.youtube.com/watch?v=MORMZXEaONk'

const {
  DEEPGRAM_API_KEY,
  ASSEMBLY_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
} = env

export const requests = [
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '01-file-default.md',
      '01-file-default.json'
    ],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      whisperModel: 'tiny',
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '02-file-whisper-tiny.md',
      '02-file-whisper-tiny.json'
    ],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'whisper',
      prompts: ['titles', 'summary'],
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '03-file-prompts.md',
      '03-file-prompts.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '04-video-default.md',
      '04-video-default.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      prompts: ['titles', 'summary'],
      whisperModel: 'tiny',
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '05-video-whisper-tiny-prompts.md',
      '05-video-whisper-tiny-prompts.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'chatgpt',
      openaiApiKey: OPENAI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '06-video-chatgpt.md',
      '06-video-chatgpt.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'claude',
      anthropicApiKey: ANTHROPIC_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '07-video-claude.md',
      '07-video-claude.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'gemini',
      geminiApiKey: GEMINI_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '08-video-gemini.md',
      '08-video-gemini.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '09-video-deepseek.md',
      '09-video-deepseek.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      transcriptServices: 'deepgram',
      deepgramApiKey: DEEPGRAM_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '10-video-deepgram.md',
      '11-video-deepgram.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
      transcriptServices: 'assembly',
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '11-video-assembly.md',
      '11-video-assembly.json'
    ],
  },
  {
    data: {
      type: 'video',
      url: 'https://ajc.pics/audio/fsjam-short.mp3',
      transcriptServices: 'assembly',
      speakerLabels: true,
      assemblyApiKey: ASSEMBLY_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: [
      '12-video-assembly-speakers.md',
      '12-video-assembly-speakers.json'
    ],
  },
]