#!/usr/bin/env node

// src/autoshow.js

/**
 * This script serves as the entry point for the 'autoshow' CLI application.
 * It processes command-line arguments and options, and initiates the appropriate
 * processing functions based on user input or interactive prompts.
 */

import { Command } from 'commander'
import { handleInteractivePrompt } from './inquirer.js'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processURLs } from './commands/processURLs.js'
import { processFile } from './commands/processFile.js'
import { processRSS } from './commands/processRSS.js'
import { argv } from 'node:process'

/** @import { ProcessingOptions, HandlerFunction, LLMOption, TranscriptOption } from './types.js' */

// Initialize the command-line interface
const program = new Command()

// Define command-line options and their descriptions
program
  .name('autoshow')
  .description('Automated processing of YouTube videos, playlists, podcast RSS feeds, and local audio/video files')
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)', 'newest')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt, 0)
  .option('--info', 'Generate JSON file with RSS feed information instead of processing items')
  .option('--whisper [modelType]', 'Use Whisper.cpp for transcription (non-Docker version)')
  .option('--whisperDocker [modelType]', 'Use Whisper.cpp for transcription (Docker version)')
  .option('--deepgram', 'Use Deepgram for transcription')
  .option('--assembly', 'Use AssemblyAI for transcription')
  .option('--speakerLabels', 'Use speaker labels for AssemblyAI transcription')
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--cohere [model]', 'Use Cohere for processing with optional model specification')
  .option('--mistral [model]', 'Use Mistral for processing')
  .option('--octo [model]', 'Use Octo for processing')
  .option('--llama [model]', 'Use Node Llama for processing with optional model specification')
  .option('--ollama [model]', 'Use Ollama for processing with optional model specification')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
  .option('--noCleanUp', 'Do not delete intermediary files after processing')

/**
 * Main action for the program.
 * @param {ProcessingOptions} options - The command-line options provided by the user.
 * @returns {Promise<void>}
 */
program.action(async (options) => {
  console.log(`Options received:\n`)
  console.log(options)
  const { video, playlist, urls, file, rss } = options

  // Check if no input options are provided and if so, prompt the user interactively
  options = [video, playlist, urls, file, rss].every(opt => !opt) 
    ? await handleInteractivePrompt(options) 
    : options

  // Ensure options.item is an array if provided via command line
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }

  /**
   * Map actions to their respective handler functions
   * @type {Object.<string, HandlerFunction>}
   */
  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processURLs,
    file: processFile,
    rss: processRSS,
  }

  /**
   * Determine the selected LLM option
   * @type {LLMOption | undefined}
   */
  const llmOpt = /** @type {LLMOption | undefined} */ ([
    'chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini'
  ].find((option) => options[option]))

  /**
   * Determine the transcription service to use
   * @type {TranscriptOption | undefined}
   */
  const transcriptOpt = /** @type {TranscriptOption | undefined} */ ([
    'whisper', 'whisperDocker', 'deepgram', 'assembly'
  ].find((option) => options[option]))

  // Execute the appropriate handler based on the action
  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      await handler(options[key], llmOpt, transcriptOpt, options)
    }
  }
})

// Parse the command-line arguments
program.parse(argv)