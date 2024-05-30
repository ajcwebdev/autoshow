// autogen.js

import { Command } from 'commander'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processUrlsFile } from './commands/processUrlsFile.js'
import { processRssFeed } from './commands/processRssFeed.js'
import { getModel } from './utils/index.js'

const program = new Command()

program
  .name('autogen')
  .description('Automated processing of YouTube videos, playlists, and podcast RSS feeds')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-r, --rss <rssUrl>', 'Process podcast episodes from an RSS feed')
  .option('-m, --model <type>', 'Select model to use: base, medium, or large', 'large')
  .option('--chatgpt', 'Generate show notes with ChatGPT')
  .option('--claude', 'Generate show notes with Claude')
  .option('--deepgram', 'Use Deepgram for transcription instead of Whisper.cpp')
  .option('--assembly', 'Use AssemblyAI for transcription instead of Whisper.cpp')

program.action(async (options) => {
  const model = getModel(options.model)
  const { chatgpt, claude, deepgram, assembly } = options
  const commonArgs = [model, chatgpt, claude, deepgram, assembly]

  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processUrlsFile,
    rss: processRssFeed,
  }

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      await handler(options[key], ...commonArgs)
    }
  }
})

program.parse(process.argv)