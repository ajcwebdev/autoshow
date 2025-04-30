// test/prompts.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils.ts'

const FILE_EXAMPLE = 'autoshow/content/examples/audio-prompt.md'
const SELECT_PROMPT_ENDPOINT = 'http://localhost:4321/api/select-prompt'
const RUN_LLM_ENDPOINT = 'http://localhost:4321/api/run-llm'
const LLM_SERVICE = 'chatgpt'
const LLM_MODEL = 'gpt-4o-mini'

const {
  OPENAI_API_KEY
} = env

export const requests = [
  {
    data: {
      options: {
        prompts: ['titles']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['01-titles-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['titles']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['01-titles.md', '01-titles.json'],
  },
  {
    data: {
      options: {
        prompts: ['summary']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['02-summary-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['summary']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['02-summary.md', '02-summary.json'],
  },
  {
    data: {
      options: {
        prompts: ['shortSummary']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['03-short-summary-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['shortSummary']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['03-short-summary.md', '03-short-summary.json'],
  },
  {
    data: {
      options: {
        prompts: ['longSummary']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['04-long-summary-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['longSummary']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['04-long-summary.md', '04-long-summary.json'],
  },
  {
    data: {
      options: {
        prompts: ['bulletPoints']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['05-bullet-points-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['bulletPoints']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['05-bullet-points.md', '05-bullet-points.json'],
  },
  {
    data: {
      options: {
        prompts: ['quotes']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['06-quotes-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['quotes']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['06-quotes.md', '06-quotes.json'],
  },
  {
    data: {
      options: {
        prompts: ['chapterTitlesAndQuotes']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['07-chapter-titles-quotes-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['chapterTitlesAndQuotes']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['07-chapter-titles-quotes.md', '07-chapter-titles-quotes.json'],
  },
  {
    data: {
      options: {
        prompts: ['x']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['08-social-x-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['x']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['08-social-x.md', '08-social-x.json'],
  },
  {
    data: {
      options: {
        prompts: ['facebook']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['09-social-facebook-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['facebook']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['09-social-facebook.md', '09-social-facebook.json'],
  },
  {
    data: {
      options: {
        prompts: ['linkedin']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['10-social-linkedin-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['linkedin']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['10-social-linkedin.md', '10-social-linkedin.json'],
  },
  {
    data: {
      options: {
        prompts: ['chapterTitles']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['11-chapter-titles-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['chapterTitles']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['11-chapter-titles.md', '11-chapter-titles.json'],
  },
  {
    data: {
      options: {
        prompts: ['shortChapters']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['12-short-chapters-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['shortChapters']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['12-short-chapters.md', '12-short-chapters.json'],
  },
  {
    data: {
      options: {
        prompts: ['mediumChapters']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['13-medium-chapters-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['mediumChapters']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['13-medium-chapters.md', '13-medium-chapters.json'],
  },
  {
    data: {
      options: {
        prompts: ['longChapters']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['14-long-chapters-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['longChapters']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['14-long-chapters.md', '14-long-chapters.json'],
  },
  {
    data: {
      options: {
        prompts: ['takeaways']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['15-takeaways-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['takeaways']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['15-takeaways.md', '15-takeaways.json'],
  },
  {
    data: {
      options: {
        prompts: ['questions']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['16-questions-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['questions']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['16-questions.md', '16-questions.json'],
  },
  {
    data: {
      options: {
        prompts: ['faq']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['17-faq-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['faq']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['17-faq.md', '17-faq.json'],
  },
  {
    data: {
      options: {
        prompts: ['blog']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['18-blog-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['blog']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['18-blog.md', '18-blog.json'],
  },
  {
    data: {
      options: {
        prompts: ['rapSong']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['19-rap-song-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['rapSong']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['19-rap-song.md', '19-rap-song.json'],
  },
  {
    data: {
      options: {
        prompts: ['rockSong']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['20-rock-song-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['rockSong']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['20-rock-song.md', '20-rock-song.json'],
  },
  {
    data: {
      options: {
        prompts: ['countrySong']
      }
    },
    endpoint: SELECT_PROMPT_ENDPOINT,
    outputFiles: ['21-country-song-prompt.md'],
  },
  {
    data: {
      filePath: FILE_EXAMPLE,
      llmServices: LLM_SERVICE,
      options: {
        chatgpt: LLM_MODEL,
        openaiApiKey: OPENAI_API_KEY,
        prompts: ['countrySong']
      }
    },
    endpoint: RUN_LLM_ENDPOINT,
    outputFiles: ['21-country-song.md', '21-country-song.json'],
  },
]

describe('Prompts Tests', () => {
  runTestsForRequests(requests, 'prompts.test.ts requests')
})