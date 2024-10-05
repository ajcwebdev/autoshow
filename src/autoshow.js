#!/usr/bin/env node

// src/autoshow.js

/**
 * Autoshow CLI Application
 *
 * Automate processing of audio and video content from various sources.
 * Supports processing YouTube videos, playlists, local files, and podcast RSS feeds.
 *
 * Documentation: https://github.com/ajcwebdev/autoshow#readme
 * Report Issues: https://github.com/ajcwebdev/autoshow/issues
 */

import { Command } from 'commander'
import { handleInteractivePrompt } from './inquirer.js'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processURLs } from './commands/processURLs.js'
import { processFile } from './commands/processFile.js'
import { processRSS } from './commands/processRSS.js'
import { argv, exit } from 'node:process'
import { log, opts } from './types.js'

/** @import { ProcessingOptions, HandlerFunction, LLMServices, TranscriptServices } from './types.js' */

// Initialize the command-line interface
const program = new Command()

// Define command-line options and their descriptions
program
  .name('autoshow')
  .version('0.0.1')
  .description('Automate processing of audio and video content from various sources.')
  .usage('[options]')
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt)
  .option('--last <number>', 'Number of most recent items to process (overrides --order and --skip)', parseInt)
  .option('--info', 'Generate JSON file with RSS feed information instead of processing items')
  .option('--whisper [model]', 'Use Whisper.cpp for transcription with optional model specification')
  .option('--whisperDocker [model]', 'Use Whisper.cpp in Docker for transcription with optional model specification')
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
  .option('-i, --interactive', 'Run in interactive mode')
  .addHelpText(
    'after',
    `
Examples:
  $ autoshow --video "https://www.youtube.com/watch?v=..."
  $ autoshow --playlist "https://www.youtube.com/playlist?list=..."
  $ autoshow --file "content/audio.mp3"
  $ autoshow --rss "https://feeds.transistor.fm/fsjam-podcast/"

Documentation: https://github.com/ajcwebdev/autoshow#readme
Report Issues: https://github.com/ajcwebdev/autoshow/issues
`
  )

/**
 * Main action for the program.
 * @param {ProcessingOptions} options - The command-line options provided by the user.
 * @returns {Promise<void>}
 */
program.action(async (options) => {
  log(opts(`Options received:\n`))
  log(options)
  log(``)

  /**
   * Map actions to their respective handler functions
   * @type {Object.<string, HandlerFunction>}
   */
  const PROCESS_HANDLERS = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processURLs,
    file: processFile,
    rss: processRSS,
  }

  const ACTION_OPTIONS = ['video', 'playlist', 'urls', 'file', 'rss']
  const LLM_OPTIONS = ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini']
  const TRANSCRIPT_OPTIONS = ['whisper', 'whisperDocker', 'deepgram', 'assembly']

  // Determine if no action options were provided
  const { video, playlist, urls, file, rss, interactive } = options
  const noActionProvided = [video, playlist, urls, file, rss].every((opt) => !opt)

  // If interactive mode is selected
  if (interactive) {
    options = await handleInteractivePrompt(options)
  } else if (noActionProvided) {
    options = await handleInteractivePrompt(options)
  }

  // Ensure options.item is an array if provided via command line
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }

  const actionsProvided = ACTION_OPTIONS.filter((opt) => options[opt])
  if (actionsProvided.length > 1) {
    console.error(`Error: Multiple input options provided (${actionsProvided.join(', ')}). Please specify only one input option.`)
    exit(1)
  }

  const selectedLLMs = LLM_OPTIONS.filter((opt) => options[opt])
  if (selectedLLMs.length > 1) {
    console.error(`Error: Multiple LLM options provided (${selectedLLMs.join(', ')}). Please specify only one LLM option.`)
    exit(1)
  }
  const llmServices = /** @type {LLMServices | undefined} */ (selectedLLMs[0])

  const selectedTranscripts = TRANSCRIPT_OPTIONS.filter((opt) => options[opt])
  if (selectedTranscripts.length > 1) {
    console.error(`Error: Multiple transcription options provided (${selectedTranscripts.join(', ')}). Please specify only one transcription option.`)
    exit(1)
  }
  const transcriptServices = /** @type {TranscriptServices | undefined} */ (selectedTranscripts[0])

  // Execute the appropriate handler based on the action
  for (const [key, handler] of Object.entries(PROCESS_HANDLERS)) {
    if (options[key]) {
      try {
        await handler(options[key], llmServices, transcriptServices, options)
        exit(0) // Successful execution
      } catch (error) {
        console.error(`Error processing ${key}:`, error.message)
        exit(1)
      }
    }
  }
})

// Handle unknown commands
program.on('command:*', function () {
  console.error(`Error: Invalid command '${program.args.join(' ')}'. Use --help to see available commands.`)
  exit(1)
})

// Parse the command-line arguments
program.parse(argv)