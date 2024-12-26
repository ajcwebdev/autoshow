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

import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { processVideo } from '../process-commands/video'
import { processPlaylist } from '../process-commands/playlist'
import { processChannel } from '../process-commands/channel'
import { processURLs } from '../process-commands/urls'
import { processFile } from '../process-commands/file'
import { processRSS } from '../process-commands/rss'
import { validateOption, isValidAction, validateRSSAction } from '../utils/validate-option'
import { ACTION_OPTIONS, LLM_OPTIONS, TRANSCRIPT_OPTIONS } from '../utils/globals'
import { l, err, logCompletionSeparator } from '../utils/logging'
import type { ProcessingOptions, HandlerFunction, LLMServices, ValidAction } from '../types/main'
import type { TranscriptServices } from '../types/transcript-service-types'

// Initialize the command-line interface using Commander.js
const program = new Command()

// Map each action to its corresponding handler function
export const PROCESS_HANDLERS: Record<ValidAction, HandlerFunction> = {
  video: processVideo,
  playlist: processPlaylist,
  channel: processChannel,
  urls: processURLs,
  file: processFile,
  rss: processRSS,
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
  l.opts(`Options received at beginning of command:\n`)
  l.opts(JSON.stringify(options, null, 2))
  l.opts(``)

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
      await validateRSSAction(options, handler, llmServices, transcriptServices)
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

    // Log completion message and exit
    logCompletionSeparator(action)
    exit(0)
  } catch (error) {
    // Handle errors during processing
    err(`Error processing ${action}:`, (error as Error).message)
    exit(1)
  }
})

// Handle invalid commands
program.on('command:*', () => {
  err(`Error: Invalid command '${program.args.join(' ')}'. Use --help to see available commands.`)
  exit(1)
})

// Only parse if this file is the actual entry point so lack of options doesn't break the server
const thisFilePath = fileURLToPath(import.meta.url)
if (process.argv[1] === thisFilePath) {
  program.parse(argv)
}