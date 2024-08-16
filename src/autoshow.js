#!/usr/bin/env node

// src/autoshow.js

import { Command } from 'commander'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processURLs } from './commands/processURLs.js'
import { processRSS } from './commands/processRSS.js'
import { processFile } from './commands/processFile.js'

const program = new Command()

program
  .name('autoshow')
  .description('Automated processing of YouTube videos, playlists, podcast RSS feeds, and local audio/video files')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)', 'newest')
  .option('--whisper <modelType>', 'Specify the Whisper model type', 'base')
  .option('--chatgpt', 'Use ChatGPT for processing')
  .option('--claude', 'Use Claude for processing')
  .option('--cohere', 'Use Cohere for processing')
  .option('--mistral', 'Use Mistral for processing')
  .option('--octo', 'Use Octo for processing')
  .option('--llama', 'Use Llama for processing')
  .option('--deepgram', 'Use Deepgram for transcription instead of Whisper.cpp')
  .option('--assembly', 'Use AssemblyAI for transcription instead of Whisper.cpp')
  .option('--docker', 'Use Docker for Whisper.cpp')

program.action(async (options) => {
  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processURLs,
    file: processFile,
    rss: processRSS,
  }

  const llmOption = [
    'chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama'
  ].find(option => options[option])
  const transcriptionOption = options.whisper

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      if (key === 'rss') {
        await handler(options[key], llmOption, transcriptionOption, options.order)
      } else {
        await handler(options[key], llmOption, transcriptionOption)
      }
    }
  }
})

program.parse(process.argv)