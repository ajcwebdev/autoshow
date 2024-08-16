#!/usr/bin/env node

// src/autoshow.js

import { Command } from 'commander'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processURLs } from './commands/processURLs.js'
import { processRSS } from './commands/processRSS.js'
import { processFile } from './commands/processFile.js'
import { getModel } from './utils/exports.js'

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
  .option('-m, --model <type>', 'Select model to use: base, medium, or large', 'base')
  .option('--chatgpt', 'Generate show notes with ChatGPT')
  .option('--claude', 'Generate show notes with Claude')
  .option('--cohere', 'Generate show notes with Cohere')
  .option('--mistral', 'Generate show notes with Mistral')
  .option('--octo', 'Generate show notes with Octo')
  // .option('--llama', 'Generate show notes with Llama')
  // .option('--ollama', 'Generate show notes with Ollama')
  .option('--deepgram', 'Use Deepgram for transcription instead of Whisper.cpp')
  .option('--assembly', 'Use AssemblyAI for transcription instead of Whisper.cpp')
  .option('--docker', 'Use Docker for Whisper.cpp')

program.action(async (options) => {
  const model = getModel(options.model)
  const { chatgpt, claude, cohere, mistral, octo, deepgram, assembly, docker, oldest, newest } = options
  const commonArgs = [ model, chatgpt, claude, cohere, mistral, octo, deepgram, assembly, docker ]

  let order = 'oldest' // Default order
  if (newest) {
    order = 'newest'
  }

  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processURLs,
    rss: (url, model) => processRSS(url, model, order),
    audio: processFile
  }

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      try {
        await handler(options[key], ...commonArgs)
      } catch (error) {
        console.error(`Error processing ${key}:`, error)
      }
    }
  }
})

program.parse(process.argv)