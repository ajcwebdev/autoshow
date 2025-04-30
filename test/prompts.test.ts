// test/prompts.test.ts

import { describe } from 'node:test'
import { runTestsForRequests } from './base.test.ts'
import { env } from '../src/utils.ts'

const FILE_EXAMPLE = 'content/examples/audio-prompt.md'
const {
  OPENAI_API_KEY
} = env

export const requests = [
  {
    data: {
      options: {
        prompt: ['titles']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['01-titles-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['01-titles.md', '01-titles.json'],
  },
  {
    data: {
      options: {
        prompt: ['summary']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['02-summary-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['02-summary.md', '02-summary.json'],
  },
  {
    data: {
      options: {
        prompt: ['shortSummary']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['03-short-summary-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['03-short-summary.md', '03-short-summary.json'],
  },
  {
    data: {
      options: {
        prompt: ['longSummary']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['04-long-summary-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['04-long-summary.md', '04-long-summary.json'],
  },
  {
    data: {
      options: {
        prompt: ['bulletPoints']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['05-bullet-points-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['05-bullet-points.md', '05-bullet-points.json'],
  },
  {
    data: {
      options: {
        prompt: ['quotes']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['06-quotes-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['06-quotes.md', '06-quotes.json'],
  },
  {
    data: {
      options: {
        prompt: ['chapterTitlesAndQuotes']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['07-chapter-titles-quotes-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['07-chapter-titles-quotes.md', '07-chapter-titles-quotes.json'],
  },
  {
    data: {
      options: {
        prompt: ['x']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['08-social-x-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['08-social-x.md', '08-social-x.json'],
  },
  {
    data: {
      options: {
        prompt: ['facebook']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['09-social-facebook-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['09-social-facebook.md', '09-social-facebook.json'],
  },
  {
    data: {
      options: {
        prompt: ['linkedin']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['10-social-linkedin-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['10-social-linkedin.md', '10-social-linkedin.json'],
  },
  {
    data: {
      options: {
        prompt: ['chapterTitles']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['11-chapter-titles-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['11-chapter-titles.md', '11-chapter-titles.json'],
  },
  {
    data: {
      options: {
        prompt: ['shortChapters']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['12-short-chapters-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['12-short-chapters.md', '12-short-chapters.json'],
  },
  {
    data: {
      options: {
        prompt: ['mediumChapters']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['13-medium-chapters-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['13-medium-chapters.md', '13-medium-chapters.json'],
  },
  {
    data: {
      options: {
        prompt: ['longChapters']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['14-long-chapters-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['14-long-chapters.md', '14-long-chapters.json'],
  },
  {
    data: {
      options: {
        prompt: ['takeaways']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['15-takeaways-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['15-takeaways.md', '15-takeaways.json'],
  },
  {
    data: {
      options: {
        prompt: ['questions']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['16-questions-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['16-questions.md', '16-questions.json'],
  },
  {
    data: {
      options: {
        prompt: ['faq']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['17-faq-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['17-faq.md', '17-faq.json'],
  },
  {
    data: {
      options: {
        prompt: ['blog']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['18-blog-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['18-blog.md', '18-blog.json'],
  },
  {
    data: {
      options: {
        prompt: ['rapSong']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['19-rap-song-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['19-rap-song.md', '19-rap-song.json'],
  },
  {
    data: {
      options: {
        prompt: ['rockSong']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['20-rock-song-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['20-rock-song.md', '20-rock-song.json'],
  },
  {
    data: {
      options: {
        prompt: ['countrySong']
      }
    },
    endpoint: 'http://localhost:4321/api/select-prompt',
    outputFiles: ['21-country-song-prompt.md'],
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
    endpoint: 'http://localhost:4321/api/run-llm',
    outputFiles: ['21-country-song.md', '21-country-song.json'],
  },
]

describe('Prompts Tests', () => {
  runTestsForRequests(requests, 'prompts.test.ts requests')
})