// test/prompts.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils/node-utils.ts'

const BASE_PATH = '/api/process'
const FILE_EXAMPLE = 'content/examples/audio.mp3'

const {
  DEEPSEEK_API_KEY
} = env

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
    outputFiles: ['01-titles.md', '01-titles.json'],
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
    outputFiles: ['02-summary.md', '02-summary.json'],
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
    outputFiles: ['03-short-summary.md', '03-short-summary.json'],
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
    outputFiles: ['04-long-summary.md', '04-long-summary.json'],
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
    outputFiles: ['05-bullet-points.md', '05-bullet-points.json'],
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
    outputFiles: ['06-quotes.md', '06-quotes.json'],
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
    outputFiles: ['07-chapter-titles-quotes.md', '07-chapter-titles-quotes.json'],
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
    outputFiles: ['08-social-x.md', '08-social-x.json'],
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
    outputFiles: ['09-social-facebook.md', '09-social-facebook.json'],
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
    outputFiles: ['10-social-linkedin.md', '10-social-linkedin.json'],
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
    outputFiles: ['11-chapter-titles.md', '11-chapter-titles.json'],
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
    outputFiles: ['12-short-chapters.md', '12-short-chapters.json'],
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
    outputFiles: ['13-medium-chapters.md', '13-medium-chapters.json'],
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
    outputFiles: ['14-long-chapters.md', '14-long-chapters.json'],
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
    outputFiles: ['15-takeaways.md', '15-takeaways.json'],
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
    outputFiles: ['16-questions.md', '16-questions.json'],
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
    outputFiles: ['17-faq.md', '17-faq.json'],
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
    outputFiles: ['18-blog.md', '18-blog.json'],
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
    outputFiles: ['19-rap-song.md', '19-rap-song.json'],
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
    outputFiles: ['20-rock-song.md', '20-rock-song.json'],
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
    outputFiles: ['21-country-song.md', '21-country-song.json'],
  },
]

describe('Prompts Tests', () => {
  runTestsForRequests(requests, 'prompts.test.ts requests')
})