// src/commander.ts

/**
 * AutoShow CLI Application
 *
 * Automate processing of audio and video content from various sources.
 * Supports processing YouTube videos, playlists, local files, and podcast RSS feeds.
 *
 * @packageDocumentation
 */

import { Command } from 'commander'
import { processAction, validateInputCLI, handleEarlyExitIfNeeded } from './commander-utils'
import { l, err, logSeparator } from './utils/logging'
import { argv, exit, fileURLToPath } from './utils/node-utils'
import { ENV_VARS_MAP } from '../shared/constants'

import type { ProcessingOptions } from './utils/types'

/**
 * Defines the command-line interface options and descriptions.
 * Sets up all available commands and their respective flags.
 */

// Initialize the command-line interface using Commander.js
const program = new Command()

program
  .name('autoshow')
  .version('0.0.1')
  .description('Automate processing of audio and video content from various sources.')
  .usage('[options]')
  // Input source options
  .option('--video <url>', 'Process a single YouTube video')
  .option('--playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('--channel <channelUrl>', 'Process all videos in a YouTube channel')
  .option('--urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('--file <filePath>', 'Process a local audio or video file')
  .option('--rss <rssURLs...>', 'Process one or more podcast RSS feeds')
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
  .option('--deepgram [model]', 'Use Deepgram for transcription with optional model specification')
  .option('--assembly [model]', 'Use AssemblyAI for transcription with optional model specification')
  .option('--speakerLabels', 'Use speaker labels for AssemblyAI transcription')
  .option('--transcriptCost <filePath>', 'Estimate transcription cost for the given file')
  .option('--llmCost <filePath>', 'Estimate LLM cost for the given prompt and transcript file')
  // LLM service options
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
  .option('--deepseek [model]', 'Use DeepSeek for processing with optional model specification')
  .option('--fireworks [model]', 'Use Fireworks AI for processing with optional model specification')
  .option('--together [model]', 'Use Together AI for processing with optional model specification')
  // Utility options
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('--printPrompt <sections...>', 'Print the prompt sections without processing')
  .option('--customPrompt <filePath>', 'Use a custom prompt from a markdown file')
  .option('--runLLM <filePath>', 'Run Step 5 with a prompt file')
  .option('--saveAudio', 'Do not delete intermediary files after processing')
  // Options to override environment variables from CLI
  .option('--openaiApiKey <key>', 'Specify OpenAI API key (overrides .env variable)')
  .option('--anthropicApiKey <key>', 'Specify Anthropic API key (overrides .env variable)')
  .option('--deepgramApiKey <key>', 'Specify Deepgram API key (overrides .env variable)')
  .option('--assemblyApiKey <key>', 'Specify AssemblyAI API key (overrides .env variable)')
  .option('--geminiApiKey <key>', 'Specify Gemini API key (overrides .env variable)')
  .option('--deepseekApiKey <key>', 'Specify DeepSeek API key (overrides .env variable)')
  .option('--togetherApiKey <key>', 'Specify Together API key (overrides .env variable)')
  .option('--fireworksApiKey <key>', 'Specify Fireworks API key (overrides .env variable)')
  // Create and query embeddings based on show notes
  .option('--createEmbeddings [directory]', 'Create embeddings for .md content (optionally specify directory)')
  .option('--queryEmbeddings <question>', 'Query embeddings by question from embeddings.db')

/**
 * Main action for the program.
 * Handles the processing of options and executes the appropriate command handler.
 * 
 * @param options - The command-line options provided by the user.
 */
program.action(async (options: ProcessingOptions) => {
  // Override environment variables from CLI if provided
  Object.entries(ENV_VARS_MAP).forEach(([key, envKey]) => {
    const value = (options as Record<string, string | undefined>)[key]
    if (value) process.env[envKey] = value
  })

  // Log options for debugging
  l.opts(`Options received at beginning of command:\n`)
  l.opts(JSON.stringify(options, null, 2))
  l.opts(``)

  await handleEarlyExitIfNeeded(options)

  // Validate action, LLM, and transcription inputs
  const { action, llmServices, transcriptServices } = validateInputCLI(options)

  try {
    // Helper to handle all action processing logic. If successful, log and exit.
    await processAction(action, options, llmServices, transcriptServices)
    logSeparator({ type: 'completion', descriptor: action })
    exit(0)
  } catch (error) {
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