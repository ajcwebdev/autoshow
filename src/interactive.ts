// src/interactive.ts

import inquirer from 'inquirer'
import type { ProcessingOptions, InquirerAnswers, WhisperModelType } from './types.js'
import {
  l, PROCESS_CHOICES, TRANSCRIPT_CHOICES, WHISPER_MODEL_CHOICES, WHISPER_LIBRARY_CHOICES, LLM_SERVICE_CHOICES, LLM_CHOICES, OLLAMA_CHOICES, CHATGPT_CHOICES, CLAUDE_CHOICES, COHERE_CHOICES, MISTRAL_CHOICES, FIREWORKS_CHOICES, TOGETHER_CHOICES, GROQ_CHOICES, GEMINI_CHOICES, PROMPT_CHOICES
} from './globals.js'

/**
 * Prompts the user for input if interactive mode is selected.
 * Handles the collection and processing of user choices through a series of
 * interactive prompts using inquirer.
 * 
 * @param options - The initial command-line options.
 * @returns The updated options after user input.
 */
export async function handleInteractivePrompt(
  options: ProcessingOptions
): Promise<ProcessingOptions> {
  // Define all interactive prompts using inquirer
  const answers: InquirerAnswers = await inquirer.prompt([
    // Content source selection prompt
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to process?',
      choices: PROCESS_CHOICES,
    },
    // Input prompts for different content sources
    {
      // Input prompt for YouTube Video
      type: 'input',
      name: 'video',
      message: 'Enter the YouTube video URL:',
      when: (answers: InquirerAnswers) => answers.action === 'video',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      // Input prompt for YouTube Playlist
      type: 'input',
      name: 'playlist',
      message: 'Enter the YouTube playlist URL:',
      when: (answers: InquirerAnswers) => answers.action === 'playlist',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      // Input prompt for YouTube Channel
      type: 'input',
      name: 'channel',
      message: 'Enter the YouTube channel URL:',
      when: (answers: InquirerAnswers) => answers.action === 'channel',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      // Input prompt for file containing a list of URLs
      type: 'input',
      name: 'urls',
      message: 'Enter the file path containing URLs:',
      when: (answers: InquirerAnswers) => answers.action === 'urls',
      validate: (input: string) => (input ? true : 'Please enter a valid file path.'),
    },
    {
      // Input prompt for local audio and video files
      type: 'input',
      name: 'file',
      message: 'Enter the local audio/video file path:',
      when: (answers: InquirerAnswers) => answers.action === 'file',
      validate: (input: string) => (input ? true : 'Please enter a valid file path.'),
    },
    // RSS feed specific prompts
    {
      // Input prompt for RSS feed
      type: 'input',
      name: 'rss',
      message: 'Enter the podcast RSS feed URL:',
      when: (answers: InquirerAnswers) => answers.action === 'rss',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      type: 'confirm',
      name: 'specifyItem',
      message: 'Do you want to process specific episodes by providing their audio URLs?',
      when: (answers: InquirerAnswers) => answers.action === 'rss' && !answers.info,
      default: false,
    },
    {
      type: 'input',
      name: 'item',
      message: 'Enter the audio URLs of the episodes (separated by commas):',
      when: (answers: InquirerAnswers) => answers.action === 'rss' && answers.specifyItem,
      validate: (input: string) => (input ? true : 'Please enter at least one valid audio URL.'),
    },
    {
      type: 'confirm',
      name: 'info',
      message: 'Do you want to generate JSON file with RSS feed information instead of processing items?',
      when: (answers: InquirerAnswers) => answers.action === 'rss',
      default: false,
    },
    {
      type: 'list',
      name: 'order',
      message: 'Specify the order for RSS feed processing:',
      choices: [
        { name: 'Newest first', value: 'newest' },
        { name: 'Oldest first', value: 'oldest' },
      ],
      when: (answers: InquirerAnswers) => answers.action === 'rss' && !answers.info,
      default: 'newest',
    },
    {
      type: 'input',
      name: 'skip',
      message: 'Number of items to skip when processing RSS feed:',
      when: (answers: InquirerAnswers) => answers.action === 'rss' && !answers.info,
      validate: (input: string) => !isNaN(Number(input)) ? true : 'Please enter a valid number.',
      filter: (input: string) => Number(input),
    },
    {
      type: 'input',
      name: 'last',
      message: 'Number of most recent items to process (overrides order and skip):',
      when: (answers: InquirerAnswers) => answers.action === 'rss' && !answers.info,
      validate: (input: string) => !isNaN(Number(input)) ? true : 'Please enter a valid number.',
      filter: (input: string) => Number(input),
    },
    // Language Model (LLM) selection and configuration
    {
      type: 'list',
      name: 'llmServices',
      message: 'Select the Language Model (LLM) you want to use:',
      choices: LLM_SERVICE_CHOICES,
    },
    // Model selection based on chosen LLM service
    {
      type: 'list',
      name: 'llmModel',
      message: 'Select the model you want to use:',
      choices: (answers: InquirerAnswers) => {
        // Return appropriate model choices based on selected LLM service
        switch (answers.llmServices) {
          case 'ollama':
            return OLLAMA_CHOICES
          case 'chatgpt':
            return CHATGPT_CHOICES
          case 'claude':
            return CLAUDE_CHOICES
          case 'gemini':
            return GEMINI_CHOICES
          case 'cohere':
            return COHERE_CHOICES
          case 'mistral':
            return MISTRAL_CHOICES
          case 'fireworks':
            return FIREWORKS_CHOICES
          case 'together':
            return TOGETHER_CHOICES
          case 'groq':
            return GROQ_CHOICES
          default:
            return []
        }
      },
      when: (answers: InquirerAnswers) =>
        LLM_CHOICES.includes(answers.llmServices as string),
    },
    // Transcription service configuration
    {
      type: 'list',
      name: 'transcriptServices',
      message: 'Select the transcription service you want to use:',
      choices: TRANSCRIPT_CHOICES,
    },
    // Whisper model configuration
    {
      type: 'list',
      name: 'whisperModel',
      message: 'Select the Whisper model type:',
      choices: WHISPER_MODEL_CHOICES,
      when: (answers: InquirerAnswers) =>
        ['whisper', 'whisperDocker', 'whisperPython', 'whisperDiarization'].includes(
          answers.transcriptServices as string
        ),
      default: 'large-v3-turbo',
    },
    // Additional configuration options
    {
      type: 'confirm',
      name: 'speakerLabels',
      message: 'Do you want to use speaker labels?',
      when: (answers: InquirerAnswers) => answers.transcriptServices === 'assembly',
      default: false,
    },
    {
      type: 'checkbox',
      name: 'prompt',
      message: 'Select the prompt sections to include:',
      choices: PROMPT_CHOICES,
      default: ['summary', 'longChapters'],
    },
    {
      type: 'confirm',
      name: 'noCleanUp',
      message: 'Do you want to keep intermediary files after processing?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'confirmAction',
      message: 'Proceed with the above configuration?',
      default: true,
    },
  ])
  // Handle user cancellation
  if (!answers.confirmAction) {
    l('Operation cancelled.')
    process.exit(0)
  }
  // Merge user answers with existing options
  options = {
    ...options,
    ...answers,
  } as ProcessingOptions
  // Configure transcription service options based on user selection
  if (answers.transcriptServices) {
    if (
      WHISPER_LIBRARY_CHOICES.includes(
        answers.transcriptServices
      )
    ) {
      // Set selected Whisper model
      (options as any)[answers.transcriptServices] = answers.whisperModel as WhisperModelType
    } else if (answers.transcriptServices === 'deepgram' || answers.transcriptServices === 'assembly') {
      // Enable selected service
      (options as any)[answers.transcriptServices] = true
    }
  }
  // Configure LLM options based on user selection
  if (answers.llmServices) {
    if (answers.llmModel) {
      (options as any)[answers.llmServices] = answers.llmModel
    } else {
      (options as any)[answers.llmServices] = true
    }
  }
  // Process RSS feed item URLs if provided
  if (typeof answers.item === 'string') {
    options.item = answers.item.split(',').map((item) => item.trim())
  }
  // Clean up temporary properties used during prompt flow
  const keysToRemove = ['action', 'specifyItem', 'confirmAction', 'llmModel', 'whisperModel']
  keysToRemove.forEach((key) => delete options[key as keyof typeof options])
  return options
}