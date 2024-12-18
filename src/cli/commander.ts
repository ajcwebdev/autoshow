#!/usr/bin/env node

// src/cli/commander.ts

/**
 * Autoshow CLI Application
 *
 * Automate processing of audio and video content from various sources.
 * Supports processing YouTube videos, playlists, local files, and podcast RSS feeds.
 *
 * @packageDocumentation
 */

import { Command } from 'commander'
import { handleInteractivePrompt } from './interactive'
import { processVideo } from '../commands/process-video'
import { processPlaylist } from '../commands/process-playlist'
import { processChannel } from '../commands/process-channel'
import { processURLs } from '../commands/process-urls'
import { processFile } from '../commands/process-file'
import { processRSS } from '../commands/process-rss'
import { validateOption } from '../utils/validate-option'
import { argv, exit } from 'node:process'
import { ACTION_OPTIONS, LLM_OPTIONS, TRANSCRIPT_OPTIONS } from '../types/globals'
import { l, err, opts, final } from '../utils/logging'
import type { ProcessingOptions, HandlerFunction, LLMServices } from '../types/main'
import type { TranscriptServices } from '../types/transcript-service-types'

// Initialize the command-line interface using Commander.js
const program = new Command()

// Define valid action types for processing
type ValidAction = 'video' | 'playlist' | 'channel' | 'urls' | 'file' | 'rss'

// Map each action to its corresponding handler function
const PROCESS_HANDLERS: Record<ValidAction, HandlerFunction> = {
  video: processVideo,
  playlist: processPlaylist,
  channel: processChannel,
  urls: processURLs,
  file: processFile,
  rss: processRSS,
}

// Type guard to check if a string is a valid action
function isValidAction(action: string | undefined): action is ValidAction {
  return Boolean(action && action in PROCESS_HANDLERS)
}

/**
 * Defines the command-line interface options and descriptions.
 * Sets up all available commands and their respective flags.
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
  .option('-r, --rss <rssURLs...>', 'Process one or more podcast RSS feeds')
  // RSS feed specific options
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt)
  .option('--last <number>', 'Number of most recent items to process (overrides --order and --skip)', parseInt)
  .option('--date <dates...>', 'Process items from these dates (YYYY-MM-DD)')
  .option('--lastDays <number>', 'Number of days to look back for items', parseInt)
  .option('--info', 'Skip processing and write metadata to JSON objects (supports --urls, --rss, --playlist, --channel)')
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
  // Add examples and additional help text
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

  // Extract interactive mode flag
  const { interactive } = options

  // If in interactive mode, prompt user for input
  if (interactive) {
    options = await handleInteractivePrompt(options)
  }

  // Ensure options.item is always an array if provided via command line
  if (options.item && !Array.isArray(options.item)) {
    options.item = [options.item]
  }

  // Ensure options.rss is always an array, in case it's a single string
  if (typeof options.rss === 'string') {
    options.rss = [options.rss]
  }

  // Extract the action values from ACTION_OPTIONS for validation
  const actionValues = ACTION_OPTIONS.map((opt) => opt.name)
  // Validate and get single options for action, LLM, and transcription
  const action = validateOption(actionValues, options, 'input option')
  const llmKey = validateOption(LLM_OPTIONS as string[], options, 'LLM option') as LLMServices | undefined
  const llmServices = llmKey as LLMServices | undefined
  const transcriptKey = validateOption(TRANSCRIPT_OPTIONS, options, 'transcription option')
  const transcriptServices: TranscriptServices = (transcriptKey as TranscriptServices) || 'whisper'

  // Set default Whisper model to 'large-v3-turbo' if whisper is selected but no model specified
  if (transcriptServices === 'whisper' && !options.whisper) {
    options.whisper = 'large-v3-turbo'
  }

  // Validate that the action is one of the valid actions
  if (!isValidAction(action)) {
    err(`Invalid or missing action`)
    exit(1)
  }

  try {
    // Get the handler function for the selected action
    const handler = PROCESS_HANDLERS[action]

    if (action === 'rss') {
      // For RSS feeds, process multiple URLs
      const rssUrls = options.rss
      if (!rssUrls || rssUrls.length === 0) {
        throw new Error(`No valid RSS URLs provided for processing`)
      }
      // Iterate over each RSS URL and process it
      for (const rssUrl of rssUrls) {
        // Process each RSS feed URL individually
        await handler(options, rssUrl, llmServices, transcriptServices)
      }
    } else {
      // Get input value with proper typing
      const input = options[action]

      // Ensure we have a valid input value
      if (!input || typeof input !== 'string') {
        throw new Error(`No valid input provided for ${action} processing`)
      }

      // Process the content using the selected handler
      await handler(options, input, llmServices, transcriptServices)
    }

    // Log completion message
    l(final(`\n================================================================================================`))
    l(final(`  ${action} Processing Completed Successfully.`))
    l(final(`================================================================================================\n`))
    exit(0)
  } catch (error) {
    // Handle errors during processing
    err(`Error processing ${action}:`, (error as Error).message)
    exit(1)
  }
})

// Handle invalid commands
program.on('command:*', function () {
  err(`Error: Invalid command '${program.args.join(' ')}'. Use --help to see available commands.`)
  exit(1)
})

// Parse the command-line arguments and execute the program
program.parse(argv)