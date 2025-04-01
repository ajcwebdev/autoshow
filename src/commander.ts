// src/commander.ts

import { Command } from 'commander'
import { processAction, validateInputCLI, handleEarlyExitIfNeeded } from './commander-utils.ts'
import { l, logSeparator, logErrorAndMaybeExit } from './utils/logging.ts'
import { argv, exit, fileURLToPath } from './utils/node-utils.ts'
import { ENV_VARS_MAP } from '../shared/constants.ts'
import type { ProcessingOptions } from '../shared/types.ts'

const program = new Command()

program
  .name('autoshow')
  .version('0.0.1')
  .description('Automate processing of audio and video content from various sources.')
  .usage('[options]')
  .option('--video <url>', 'Process a single YouTube video')
  .option('--playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('--channel <channelUrl>', 'Process all videos in a YouTube channel')
  .option('--urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('--file <filePath>', 'Process a local audio or video file')
  .option('--rss <rssURLs...>', 'Process one or more podcast RSS feeds')
  .option('--item <itemUrls...>', 'Process specific items in the RSS feed by providing their audio URLs')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt)
  .option('--last <number>', 'Number of most recent items to process (overrides --order and --skip)', parseInt)
  .option('--date <dates...>', 'Process items from these dates (YYYY-MM-DD)')
  .option('--lastDays <number>', 'Number of days to look back for items', parseInt)
  .option('--info', 'Skip processing and write metadata to JSON (supports --urls, --rss, --playlist, --channel)')
  .option('--whisper [model]', 'Use Whisper.cpp for transcription with optional model specification')
  .option('--deepgram [model]', 'Use Deepgram for transcription with optional model specification')
  .option('--assembly [model]', 'Use AssemblyAI for transcription with optional model specification')
  .option('--speakerLabels', 'Use speaker labels for AssemblyAI transcription')
  .option('--transcriptCost <filePath>', 'Estimate transcription cost for the given file')
  .option('--llmCost <filePath>', 'Estimate LLM cost for the given prompt+transcript file')
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
  .option('--deepseek [model]', 'Use DeepSeek for processing with optional model specification')
  .option('--fireworks [model]', 'Use Fireworks AI for processing with optional model specification')
  .option('--together [model]', 'Use Together AI for processing with optional model specification')
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('--printPrompt <sections...>', 'Print the prompt sections without processing')
  .option('--customPrompt <filePath>', 'Use a custom prompt from a markdown file')
  .option('--runLLM <filePath>', 'Run Step 5 with a prompt file')
  .option('--saveAudio', 'Do not delete intermediary files after processing')
  .option('--openaiApiKey <key>', 'Specify OpenAI API key (overrides .env variable)')
  .option('--anthropicApiKey <key>', 'Specify Anthropic API key (overrides .env variable)')
  .option('--deepgramApiKey <key>', 'Specify Deepgram API key (overrides .env variable)')
  .option('--assemblyApiKey <key>', 'Specify AssemblyAI API key (overrides .env variable)')
  .option('--geminiApiKey <key>', 'Specify Gemini API key (overrides .env variable)')
  .option('--deepseekApiKey <key>', 'Specify DeepSeek API key (overrides .env variable)')
  .option('--togetherApiKey <key>', 'Specify Together AI API key (overrides .env variable)')
  .option('--fireworksApiKey <key>', 'Specify Fireworks API key (overrides .env variable)')
  .option('--createEmbeddings [directory]', 'Create embeddings for .md content (optionally specify directory)')
  .option('--queryEmbeddings <question>', 'Query embeddings by question from embeddings.db')

program.action(async (options: ProcessingOptions) => {
  Object.entries(ENV_VARS_MAP).forEach(([key, envKey]) => {
    const value = (options as Record<string, string | undefined>)[key]
    if (value) process.env[envKey] = value
  })

  l.opts(`Options received:\n`)
  l.opts(JSON.stringify(options, null, 2))
  l.opts('')

  await handleEarlyExitIfNeeded(options)
  const { action, llmServices, transcriptServices } = validateInputCLI(options)

  try {
    await processAction(action, options, llmServices, transcriptServices)
    logSeparator({ type: 'completion', descriptor: action })
    exit(0)
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    logErrorAndMaybeExit(`Error processing ${action}:`, e, true)
  }
})

program.on('command:*', () => {
  logErrorAndMaybeExit(`Error: Invalid command '${program.args.join(' ')}'. Use --help.`)
})

const thisFilePath = fileURLToPath(import.meta.url)
if (process.argv[1] === thisFilePath) {
  program.parse(argv)
}
