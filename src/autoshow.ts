#!/usr/bin/env node

// src/autoshow.ts

/**
 * Autoshow CLI Application
 *
 * Automate processing of audio and video content from various sources.
 * Supports processing YouTube videos, playlists, local files, and podcast RSS feeds.
 *
 * @packageDocumentation
 */

import { Command } from 'commander'
import { handleInteractivePrompt } from './interactive.js'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processChannel } from './commands/processChannel.js'
import { processURLs } from './commands/processURLs.js'
import { processFile } from './commands/processFile.js'
import { processRSS } from './commands/processRSS.js'
import { validateOption } from './utils/validateOption.js'
import { argv, exit } from 'node:process'
import { l, err, opts, final, ACTION_OPTIONS, LLM_OPTIONS, TRANSCRIPT_OPTIONS } from './globals.js'
import type { ProcessingOptions, HandlerFunction, LLMServices, TranscriptServices } from './types.js'

// Initialize the command-line interface using Commander.js
const program = new Command()

/**
 * Defines the command-line interface options and descriptions.
 * Sets up all available commands and their respective flags
 */
program
  .name('autoshow')
  .version('0.0.1')
  .description('Automate processing of audio and video content from various sources.')
  .usage('[options]')
  // Input source options
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-c, --channel <channelUrl>', 'Process all videos in a YouTube channel')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  // RSS feed specific options
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt)
  .option('--last <number>', 'Number of most recent items to process (overrides --order and --skip)', parseInt)
  .option('--info', 'Generate JSON file with RSS feed or channel information instead of processing items')
  // Transcription service options
  .option('--whisper [model]', 'Use Whisper.cpp for transcription with optional model specification')
  .option('--whisperDocker [model]', 'Use Whisper.cpp in Docker for transcription with optional model specification')
  .option('--whisperPython [model]', 'Use openai-whisper for transcription with optional model specification')
  .option('--whisperDiarization [model]', 'Use whisper-diarization for transcription with optional model specification')
  .option('--deepgram', 'Use Deepgram for transcription')
  .option('--assembly', 'Use AssemblyAI for transcription')
  .option('--speakerLabels', 'Use speaker labels for AssemblyAI transcription')
  // LLM service options
  .option('--ollama [model]', 'Use Ollama for processing with optional model specification')
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
  .option('--cohere [model]', 'Use Cohere for processing with optional model specification')
  .option('--mistral [model]', 'Use Mistral for processing')
  .option('--fireworks [model]', 'Use Fireworks AI for processing with optional model specification')
  .option('--together [model]', 'Use Together AI for processing with optional model specification')
  .option('--groq [model]', 'Use Groq for processing with optional model specification')
  // Utility options
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('--noCleanUp', 'Do not delete intermediary files after processing')
  .option('-i, --interactive', 'Run in interactive mode')
  .addHelpText(
    'after',
    `
Examples:
  $ autoshow --video "https://www.youtube.com/watch?v=..."
  $ autoshow --playlist "https://www.youtube.com/playlist?list=..."
  $ autoshow --channel "https://www.youtube.com/channel/..."
  $ autoshow --file "content/audio.mp3"
  $ autoshow --rss "https://feeds.transistor.fm/fsjam-podcast/"

Documentation: https://github.com/ajcwebdev/autoshow#readme
Report Issues: https://github.com/ajcwebdev/autoshow/issues
`
  )

/**
 * Main action for the program.
 * Handles the processing of options and executes the appropriate command handler.
 * 
 * @param options - The command-line options provided by the user.
 */
program.action(async (options: ProcessingOptions) => {
  // Log received options for debugging purposes
  l(opts(`Options received at beginning of command:\n`))
  l(opts(JSON.stringify(options, null, 2)))
  l(``)

  // Define mapping of action types to their handler functions
  const PROCESS_HANDLERS: Record<string, HandlerFunction> = {
    video: processVideo,
    playlist: processPlaylist,
    channel: processChannel,
    urls: processURLs,
    file: processFile,
    rss: processRSS,
  }

  // Extract interactive mode flag
  const { interactive } = options
  
  // Check if no action option was provided
  const noActionProvided = ACTION_OPTIONS.every((opt) => !options[opt as keyof ProcessingOptions])

  // If in interactive mode or no action provided, prompt user for input
  if (interactive || noActionProvided) {
    options = await handleInteractivePrompt(options)
  }

  // Ensure options.item is always an array if provided via command line
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }

  // Validate and get single options for action, LLM, and transcription
  const action = validateOption(ACTION_OPTIONS, options, 'input option')
  const llmKey = validateOption(LLM_OPTIONS, options, 'LLM option')
  const llmServices = llmKey as LLMServices | undefined
  const transcriptKey = validateOption(TRANSCRIPT_OPTIONS, options, 'transcription option')
  const transcriptServices: TranscriptServices = (transcriptKey as TranscriptServices) || 'whisper'

  // Set default Whisper model to 'large-v3-turbo' if whisper is selected but no model specified
  if (transcriptServices === 'whisper' && !options.whisper) {
    options.whisper = 'large-v3-turbo'
  }

  // Execute the appropriate handler if an action was specified
  if (action) {
    try {
      // Process the content using the selected handler
      await PROCESS_HANDLERS[action](
        options,
        options[action as keyof ProcessingOptions] as string,
        llmServices,
        transcriptServices
      )
      l(final(`\n================================================================================================`))
      l(final(`  ${action} Processing Completed Successfully.`))
      l(final(`================================================================================================\n`))
      exit(0)
    } catch (error) {
      err(`Error processing ${action}:`, (error as Error).message)
      exit(1)
    }
  }
})

program.on('command:*', function () {
  err(`Error: Invalid command '${program.args.join(' ')}'. Use --help to see available commands.`)
  exit(1)
})

// Parse the command-line arguments and execute the program
program.parse(argv)