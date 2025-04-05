// test/prompts.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils/node-utils.ts'

const {
  DEEPSEEK_API_KEY
} = env

const BASE_PATH = '/api/process'
const FILE_EXAMPLE = 'content/examples/audio.mp3'

export const requests = [
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['titles'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['01-titles.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['summary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['02-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['shortSummary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['03-short-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['longSummary'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['04-long-summary.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['bulletPoints'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['05-bullet-points.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['quotes'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['06-quotes.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['chapterTitlesAndQuotes'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['07-chapter-titles-quotes.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['x'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['08-social-x.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['facebook'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['09-social-facebook.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['linkedin'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['10-social-linkedin.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['chapterTitles'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['11-chapter-titles.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['shortChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['12-short-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['mediumChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['13-medium-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['longChapters'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['14-long-chapters.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['takeaways'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['15-takeaways.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['questions'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['16-questions.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['faq'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['17-faq.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['blog'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['18-blog.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['rapSong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['19-rap-song.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['rockSong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['20-rock-song.md'],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      prompts: ['countrySong'],
      llm: 'deepseek',
      deepseekApiKey: DEEPSEEK_API_KEY,
    },
    endpoint: BASE_PATH,
    outputFiles: ['21-country-song.md'],
  },
]

describe('Prompts Tests', () => {
  runTestsForRequests(requests, 'prompts.test.ts requests')
})