// test/local.test.ts

const BASE_PATH = '/api/process'
const FILE_EXAMPLE = 'content/examples/audio.mp3'
const VIDEO_EXAMPLE = 'https://www.youtube.com/watch?v=MORMZXEaONk'

export const requests = [
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: ['01-file-default.md', `01-file-default.json`],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      whisperModel: 'tiny',
    },
    endpoint: BASE_PATH,
    outputFiles: ['02-file-whisper-tiny.md', `02-file-whisper-tiny.json`],
  },
  {
    data: {
      type: 'file',
      filePath: FILE_EXAMPLE,
      transcriptServices: 'whisper',
      prompts: ['titles', 'summary'],
    },
    endpoint: BASE_PATH,
    outputFiles: ['03-file-prompts.md', `03-file-prompts.json`],
  },
  {
    data: {
      type: 'video',
      url: VIDEO_EXAMPLE,
    },
    endpoint: BASE_PATH,
    outputFiles: ['04-video-default.md', '04-video-default.json'],
  },
]