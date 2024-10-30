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
import { processURLs } from './commands/processURLs.js'
import { processFile } from './commands/processFile.js'
import { processRSS } from './commands/processRSS.js'
import { argv, exit } from 'node:process'
import { log, opts, final, ACTION_OPTIONS, LLM_OPTIONS, TRANSCRIPT_OPTIONS } from './models.js'
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
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  // RSS feed specific options
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt)
  .option('--last <number>', 'Number of most recent items to process (overrides --order and --skip)', parseInt)
  .option('--info', 'Generate JSON file with RSS feed information instead of processing items')
  // Transcription service options
  .option('--whisper [model]', 'Use Whisper.cpp for transcription with optional model specification')
  .option('--whisperDocker [model]', 'Use Whisper.cpp in Docker for transcription with optional model specification')
  .option('--whisperPython [model]', 'Use openai-whisper for transcription with optional model specification')
  .option('--whisperDiarization [model]', 'Use whisper-diarization for transcription with optional model specification')
  .option('--deepgram', 'Use Deepgram for transcription')
  .option('--assembly', 'Use AssemblyAI for transcription')
  .option('--speakerLabels', 'Use speaker labels for AssemblyAI transcription')
  // LLM service options
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--cohere [model]', 'Use Cohere for processing with optional model specification')
  .option('--mistral [model]', 'Use Mistral for processing')
  .option('--fireworks [model]', 'Use Fireworks AI for processing with optional model specification')
  .option('--together [model]', 'Use Together AI for processing with optional model specification')
  .option('--groq [model]', 'Use Groq for processing with optional model specification')
  .option('--ollama [model]', 'Use Ollama for processing with optional model specification')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
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
  $ autoshow --file "content/audio.mp3"
  $ autoshow --rss "https://feeds.transistor.fm/fsjam-podcast/"

Documentation: https://github.com/ajcwebdev/autoshow#readme
Report Issues: https://github.com/ajcwebdev/autoshow/issues
`
  )

/**
 * Helper function to validate that only one option from a list is provided.
 * Prevents users from specifying multiple conflicting options simultaneously.
 * 
 * @param optionKeys - The list of option keys to check.
 * @param options - The options object.
 * @param errorMessage - The prefix of the error message.
 * @returns The selected option or undefined.
 */
function getSingleOption(
  optionKeys: string[],
  options: ProcessingOptions,
  errorMessage: string
): string | undefined {
  // Filter out which options from the provided list are actually set
  const selectedOptions = optionKeys.filter((opt) => options[opt as keyof ProcessingOptions])
  
  // If more than one option is selected, throw an error
  if (selectedOptions.length > 1) {
    console.error(`Error: Multiple ${errorMessage} provided (${selectedOptions.join(', ')}). Please specify only one.`)
    exit(1)
  }
  return selectedOptions[0] as string | undefined
}

/**
 * Main action for the program.
 * Handles the processing of options and executes the appropriate command handler.
 * 
 * @param options - The command-line options provided by the user.
 */
program.action(async (options: ProcessingOptions) => {
  // Log received options for debugging purposes
  log(opts(`Options received at beginning of command:\n`))
  log(options)
  log(``)

  // Define mapping of action types to their handler functions
  const PROCESS_HANDLERS: Record<string, HandlerFunction> = {
    video: processVideo,
    playlist: processPlaylist,
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
  const action = getSingleOption(ACTION_OPTIONS, options, 'input option')
  const llmKey = getSingleOption(LLM_OPTIONS, options, 'LLM option')
  const llmServices = llmKey as LLMServices | undefined
  const transcriptKey = getSingleOption(TRANSCRIPT_OPTIONS, options, 'transcription option')
  const transcriptServices: TranscriptServices | undefined = transcriptKey as TranscriptServices | undefined

  // Set default transcription service to whisper if none provided
  const finalTranscriptServices: TranscriptServices = transcriptServices || 'whisper'

  // Set default Whisper model to 'large-v3-turbo' if whisper is selected but no model specified
  if (finalTranscriptServices === 'whisper' && !options.whisper) {
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
        finalTranscriptServices
      )
      // Log success message
      log(final(`\n================================================================================================`))
      log(final(`  ${action} Processing Completed Successfully.`))
      log(final(`================================================================================================\n`))
      exit(0)
    } catch (error) {
      // Log error and exit if processing fails
      console.error(`Error processing ${action}:`, (error as Error).message)
      exit(1)
    }
  }
})

// Set up error handling for unknown commands
program.on('command:*', function () {
  console.error(`Error: Invalid command '${program.args.join(' ')}'. Use --help to see available commands.`)
  exit(1)
})

// Parse the command-line arguments and execute the program
program.parse(argv)