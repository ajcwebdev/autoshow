#!/usr/bin/env node

// src/autoshow.js

import { Command } from 'commander'
import inquirer from 'inquirer'
import { processVideo } from './commands/processVideo.js'
import { processPlaylist } from './commands/processPlaylist.js'
import { processURLs } from './commands/processURLs.js'
import { processFile } from './commands/processFile.js'
import { processRSS } from './commands/processRSS.js'
import { env } from 'node:process'

const program = new Command()

program
  .name('autoshow')
  .description('Automated processing of YouTube videos, playlists, podcast RSS feeds, and local audio/video files')
  .option('--prompt <sections...>', 'Specify prompt sections to include')
  .option('-v, --video <url>', 'Process a single YouTube video')
  .option('-p, --playlist <playlistUrl>', 'Process all videos in a YouTube playlist')
  .option('-u, --urls <filePath>', 'Process YouTube videos from a list of URLs in a file')
  .option('-f, --file <filePath>', 'Process a local audio or video file')
  .option('-r, --rss <rssURL>', 'Process a podcast RSS feed')
  .option('--order <order>', 'Specify the order for RSS feed processing (newest or oldest)', 'newest')
  .option('--skip <number>', 'Number of items to skip when processing RSS feed', parseInt, 0)
  .option('--whisper [modelType]', 'Use Whisper.cpp for transcription (non-Docker version)')
  .option('--whisper-docker [modelType]','Use Whisper.cpp for transcription (Docker version)')
  .option('--chatgpt [model]', 'Use ChatGPT for processing with optional model specification')
  .option('--claude [model]', 'Use Claude for processing with optional model specification')
  .option('--cohere [model]', 'Use Cohere for processing with optional model specification')
  .option('--mistral [model]', 'Use Mistral for processing')
  .option('--octo [model]', 'Use Octo for processing')
  .option('--llama', 'Use Llama for processing')
  .option('--gemini [model]', 'Use Gemini for processing with optional model specification')
  .option('--deepgram', 'Use Deepgram for transcription')
  .option('--assembly', 'Use AssemblyAI for transcription')
  .option('--speaker-labels', 'Use speaker labels for AssemblyAI transcription')
  .option('--speakers-expected <number>', 'Number of expected speakers for AssemblyAI transcription', parseInt, 1)
  .option('--noCleanUp', 'Do not delete intermediary files after processing')

program.action(async (options) => {
  console.log(`Options received:\n`)
  console.log(options)

  // Check if no primary input options are provided
  const noInputOptions =
    !options.video && !options.playlist && !options.urls && !options.file && !options.rss

  if (noInputOptions) {
    // No input options provided, trigger Inquirer prompts
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to process?',
        choices: [
          { name: 'Single YouTube Video', value: 'video' },
          { name: 'YouTube Playlist', value: 'playlist' },
          { name: 'List of URLs from File', value: 'urls' },
          { name: 'Local Audio/Video File', value: 'file' },
          { name: 'Podcast RSS Feed', value: 'rss' },
        ],
      },
      {
        type: 'input',
        name: 'video',
        message: 'Enter the YouTube video URL:',
        when: (answers) => answers.action === 'video',
        validate: (input) => (input ? true : 'Please enter a valid URL.'),
      },
      {
        type: 'input',
        name: 'playlist',
        message: 'Enter the YouTube playlist URL:',
        when: (answers) => answers.action === 'playlist',
        validate: (input) => (input ? true : 'Please enter a valid URL.'),
      },
      {
        type: 'input',
        name: 'urls',
        message: 'Enter the file path containing URLs:',
        when: (answers) => answers.action === 'urls',
        validate: (input) => (input ? true : 'Please enter a valid file path.'),
      },
      {
        type: 'input',
        name: 'file',
        message: 'Enter the local audio/video file path:',
        when: (answers) => answers.action === 'file',
        validate: (input) => (input ? true : 'Please enter a valid file path.'),
      },
      {
        type: 'input',
        name: 'rss',
        message: 'Enter the podcast RSS feed URL:',
        when: (answers) => answers.action === 'rss',
        validate: (input) => (input ? true : 'Please enter a valid URL.'),
      },
      {
        type: 'list',
        name: 'llmOption',
        message: 'Select the Language Model (LLM) you want to use:',
        choices: [
          { name: 'OpenAI ChatGPT', value: 'chatgpt' },
          { name: 'Anthropic Claude', value: 'claude' },
          { name: 'Cohere', value: 'cohere' },
          { name: 'Mistral', value: 'mistral' },
          { name: 'OctoAI', value: 'octo' },
          { name: 'Llama (local inference)', value: 'llama' },
          { name: 'Google Gemini', value: 'gemini' },
          { name: 'Skip LLM Processing', value: null },
        ],
      },
      {
        type: 'list',
        name: 'transcriptionOption',
        message: 'Select the transcription service you want to use:',
        choices: [
          { name: 'Whisper.cpp', value: 'whisper' },
          { name: 'Deepgram', value: 'deepgram' },
          { name: 'AssemblyAI', value: 'assembly' },
        ],
      },
      {
        type: 'confirm',
        name: 'useDocker',
        message: 'Do you want to run Whisper.cpp in a Docker container?',
        when: (answers) => answers.transcriptionOption === 'whisper',
        default: false,
      },
      {
        type: 'list',
        name: 'whisperModelType',
        message: 'Select the Whisper model type:',
        choices: ['tiny', 'base', 'small', 'medium', 'large'],
        when: (answers) => answers.transcriptionOption === 'whisper',
        default: 'large',
      },
      {
        type: 'confirm',
        name: 'speakerLabels',
        message: 'Do you want to use speaker labels?',
        when: (answers) => answers.transcriptionOption === 'assembly',
        default: false,
      },
      {
        type: 'number',
        name: 'speakersExpected',
        message: 'How many speakers are expected?',
        when: (answers) => answers.speakerLabels,
        default: 1,
        validate: (input) =>
          input > 0 && input <= 25 ? true : 'Please enter a number between 1 and 25.',
      },
      {
        type: 'checkbox',
        name: 'prompt',
        message: 'Select the prompt sections to include:',
        choices: [
          { name: 'Titles', value: 'titles' },
          { name: 'Summary', value: 'summary' },
          { name: 'Short Chapters', value: 'shortChapters' },
          { name: 'Medium Chapters', value: 'mediumChapters' },
          { name: 'Long Chapters', value: 'longChapters' },
          { name: 'Key Takeaways', value: 'takeaways' },
          { name: 'Questions', value: 'questions' },
        ],
        default: ['summary', 'longChapters'],
      },
      {
        type: 'confirm',
        name: 'noCleanUp',
        message: 'Do you want to keep intermediary files after processing?',
        default: false,
      },
    ])

    // Map Inquirer answers to Commander.js options
    options = {
      ...options,
      ...answers,
    }

    // Map the selected LLM to the appropriate option
    if (answers.llmOption) {
      options[answers.llmOption] = true
    }

    // Set transcription options based on user selection
    if (answers.transcriptionOption === 'whisper') {
      if (answers.useDocker) {
        options.whisperDocker = answers.whisperModelType
      } else {
        options.whisper = answers.whisperModelType
      }
    } else if (answers.transcriptionOption === 'deepgram') {
      options.deepgram = true
    } else if (answers.transcriptionOption === 'assembly') {
      options.assembly = true
      options.speakerLabels = answers.speakerLabels
      options.speakersExpected = answers.speakersExpected
    }
  }

  const handlers = {
    video: processVideo,
    playlist: processPlaylist,
    urls: processURLs,
    file: processFile,
    rss: processRSS,
  }

  let transcriptionOption = 'whisper' // default

  if (options.deepgram) {
    transcriptionOption = 'deepgram'
  } else if (options.assembly) {
    transcriptionOption = 'assembly'
  } else if (options.whisperDocker) {
    transcriptionOption = 'whisper-docker'
  } else if (options.whisper) {
    transcriptionOption = 'whisper'
  }

  const llmOption = ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'gemini'].find(
    (option) => options[option]
  )

  for (const [key, handler] of Object.entries(handlers)) {
    if (options[key]) {
      await handler(options[key], llmOption, transcriptionOption, options)
    }
  }
})

program.parse(env.argv)