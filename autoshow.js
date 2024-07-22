#!/usr/bin/env node

// autoshow.js

import { Command } from 'commander'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processUrlsFile } from './commands/processUrlsFile.js'
import { processRssFeed } from './commands/processRssFeed.js'
import { processAudioFile } from './commands/processAudioFile.js'
import { getModel } from './utils/index.js'
import { performance } from 'perf_hooks'

const program = new Command()

program
  .name('autoshow')
  .description('Automated processing of YouTube videos, playlists, and podcast RSS feeds')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-r, --rss <rssUrl>', 'Process podcast episodes from an RSS feed')
  .option('-a, --audio <filePath>', 'Process a local audio file')
  .option('--oldest', 'Process items from oldest to newest (default)')
  .option('--newest', 'Process items from newest to oldest')
  .option('-m, --model <type>', 'Select model to use: base, medium, or large', 'large')
  .option('--chatgpt', 'Generate show notes with ChatGPT')
  .option('--claude', 'Generate show notes with Claude')
  .option('--cohere', 'Generate show notes with Cohere')
  .option('--mistral', 'Generate show notes with Mistral')
  .option('--octo', 'Generate show notes with Octo')
  .option('--llama', 'Generate show notes with Llama')
  .option('--deepgram', 'Use Deepgram for transcription instead of Whisper.cpp')
  .option('--assembly', 'Use AssemblyAI for transcription instead of Whisper.cpp')
  .option('--docker', 'Use Docker for Whisper.cpp')
  .option('--profile', 'Log detailed performance metrics for each step')

program.action(async (options) => {
  const model = getModel(options.model)
  const { chatgpt, claude, cohere, mistral, octo, llama, deepgram, assembly, docker, profile, oldest, newest } = options
  const commonArgs = [ model, chatgpt, claude, cohere, mistral, octo, llama, deepgram, assembly, docker ]

  let order = 'oldest' // Default order
  if (newest) {
    order = 'newest'
  }

  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processUrlsFile,
    rss: (url, model) => processRssFeed(url, model, order),
    audio: processAudioFile
  }

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      const start = performance.now()
      try {
        await handler(options[key], ...commonArgs)
        const end = performance.now()
        if (profile) {
          const duration = ((end - start) / 1000).toFixed(2)
          console.log(`Processed ${key} in ${duration} seconds`)
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error)
      }
    }
  }
})

program.parse(process.argv)