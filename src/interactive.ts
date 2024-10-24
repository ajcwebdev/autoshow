// src/interactive.ts

import inquirer from 'inquirer'
import type { ProcessingOptions, InquirerAnswers, WhisperModelType } from './types.js'
import { log } from './models.js'

/**
 * Prompts the user for input if interactive mode is selected.
 * @param options - The initial command-line options.
 * @returns The updated options after user input.
 */
export async function handleInteractivePrompt(
  options: ProcessingOptions
): Promise<ProcessingOptions> {
  const answers: InquirerAnswers = await inquirer.prompt([
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
      when: (answers: InquirerAnswers) => answers.action === 'video',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      type: 'input',
      name: 'playlist',
      message: 'Enter the YouTube playlist URL:',
      when: (answers: InquirerAnswers) => answers.action === 'playlist',
      validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
    },
    {
      type: 'input',
      name: 'urls',
      message: 'Enter the file path containing URLs:',
      when: (answers: InquirerAnswers) => answers.action === 'urls',
      validate: (input: string) => (input ? true : 'Please enter a valid file path.'),
    },
    {
      type: 'input',
      name: 'file',
      message: 'Enter the local audio/video file path:',
      when: (answers: InquirerAnswers) => answers.action === 'file',
      validate: (input: string) => (input ? true : 'Please enter a valid file path.'),
    },
    {
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
      message:
        'Do you want to generate JSON file with RSS feed information instead of processing items?',
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
      validate: (input: string) =>
        !isNaN(Number(input)) ? true : 'Please enter a valid number.',
      filter: (input: string) => Number(input),
    },
    {
      type: 'input',
      name: 'last',
      message: 'Number of most recent items to process (overrides order and skip):',
      when: (answers: InquirerAnswers) => answers.action === 'rss' && !answers.info,
      validate: (input: string) =>
        !isNaN(Number(input)) ? true : 'Please enter a valid number.',
      filter: (input: string) => Number(input),
    },
    {
      type: 'list',
      name: 'llmServices',
      message: 'Select the Language Model (LLM) you want to use:',
      choices: [
        { name: 'Skip LLM Processing', value: null },
        { name: 'node-llama-cpp (local inference)', value: 'llama' },
        { name: 'Ollama (local inference)', value: 'ollama' },
        { name: 'OpenAI ChatGPT', value: 'chatgpt' },
        { name: 'Anthropic Claude', value: 'claude' },
        { name: 'Google Gemini', value: 'gemini' },
        { name: 'Cohere', value: 'cohere' },
        { name: 'Mistral', value: 'mistral' },
        { name: 'OctoAI', value: 'octo' },
        { name: 'Fireworks AI', value: 'fireworks' },
        { name: 'Together AI', value: 'together' },
        { name: 'Groq', value: 'groq' },
      ],
    },
    {
      type: 'list',
      name: 'llmModel',
      message: 'Select the model you want to use:',
      choices: (answers: InquirerAnswers) => {
        switch (answers.llmServices) {
          case 'llama':
            return [
              { name: 'LLAMA 3 8B Q4 Model', value: 'LLAMA_3_1_8B_Q4_MODEL' },
              { name: 'LLAMA 3 8B Q6 Model', value: 'LLAMA_3_1_8B_Q6_MODEL' },
              { name: 'GEMMA 2 2B Q4 Model', value: 'GEMMA_2_2B_Q4_MODEL' },
              { name: 'GEMMA 2 2B Q6 Model', value: 'GEMMA_2_2B_Q6_MODEL' },
            ]
          case 'ollama':
            return [
              { name: 'LLAMA 3 2 1B', value: 'LLAMA_3_2_1B' },
              { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
              { name: 'GEMMA 2 2B', value: 'GEMMA_2_2B' },
              { name: 'PHI 3 5', value: 'PHI_3_5' },
              { name: 'QWEN 2 5 1B', value: 'QWEN_2_5_1B' },
              { name: 'QWEN 2 5 3B', value: 'QWEN_2_5_3B' },
            ]
          case 'chatgpt':
            return [
              { name: 'GPT 4 o MINI', value: 'GPT_4o_MINI' },
              { name: 'GPT 4 o', value: 'GPT_4o' },
              { name: 'GPT 4 TURBO', value: 'GPT_4_TURBO' },
              { name: 'GPT 4', value: 'GPT_4' },
            ]
          case 'claude':
            return [
              { name: 'Claude 3.5 Sonnet', value: 'CLAUDE_3_5_SONNET' },
              { name: 'Claude 3 Opus', value: 'CLAUDE_3_OPUS' },
              { name: 'Claude 3 Sonnet', value: 'CLAUDE_3_SONNET' },
              { name: 'Claude 3 Haiku', value: 'CLAUDE_3_HAIKU' },
            ]
          case 'cohere':
            return [
              { name: 'Command R', value: 'COMMAND_R' },
              { name: 'Command R Plus', value: 'COMMAND_R_PLUS' },
            ]
          case 'mistral':
            return [
              { name: 'Mixtral 8x7b', value: 'MIXTRAL_8x7b' },
              { name: 'Mixtral 8x22b', value: 'MIXTRAL_8x22b' },
              { name: 'Mistral Large', value: 'MISTRAL_LARGE' },
              { name: 'Mistral Nemo', value: 'MISTRAL_NEMO' },
            ]
          case 'octo':
            return [
              { name: 'LLAMA 3 1 8B', value: 'LLAMA_3_1_8B' },
              { name: 'LLAMA 3 1 70B', value: 'LLAMA_3_1_70B' },
              { name: 'LLAMA 3 1 405B', value: 'LLAMA_3_1_405B' },
              { name: 'Mistral 7B', value: 'MISTRAL_7B' },
              { name: 'Mixtral 8x7b', value: 'MIXTRAL_8X_7B' },
              { name: 'Nous Hermes Mixtral 8x7b', value: 'NOUS_HERMES_MIXTRAL_8X_7B' },
              { name: 'Wizard 2 8x22b', value: 'WIZARD_2_8X_22B' },
            ]
          case 'fireworks':
            return [
              { name: 'LLAMA 3 1 405B', value: 'LLAMA_3_1_405B' },
              { name: 'LLAMA 3 1 70B', value: 'LLAMA_3_1_70B' },
              { name: 'LLAMA 3 1 8B', value: 'LLAMA_3_1_8B' },
              { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
              { name: 'LLAMA 3 2 1B', value: 'LLAMA_3_2_1B' },
              { name: 'QWEN 2 5 72B', value: 'QWEN_2_5_72B' },
            ]
          case 'together':
            return [
              { name: 'LLAMA 3 2 3B', value: 'LLAMA_3_2_3B' },
              { name: 'LLAMA 3 1 405B', value: 'LLAMA_3_1_405B' },
              { name: 'LLAMA 3 1 70B', value: 'LLAMA_3_1_70B' },
              { name: 'LLAMA 3 1 8B', value: 'LLAMA_3_1_8B' },
              { name: 'Gemma 2 27B', value: 'GEMMA_2_27B' },
              { name: 'Gemma 2 9B', value: 'GEMMA_2_9B' },
              { name: 'QWEN 2 5 72B', value: 'QWEN_2_5_72B' },
              { name: 'QWEN 2 5 7B', value: 'QWEN_2_5_7B' },
            ]
          case 'groq':
            return [
              { name: 'LLAMA 3 1 70B Versatile', value: 'LLAMA_3_1_70B_VERSATILE' },
              { name: 'LLAMA 3 1 8B Instant', value: 'LLAMA_3_1_8B_INSTANT' },
              { name: 'LLAMA 3 2 1B Preview', value: 'LLAMA_3_2_1B_PREVIEW' },
              { name: 'LLAMA 3 2 3B Preview', value: 'LLAMA_3_2_3B_PREVIEW' },
              { name: 'Mixtral 8x7b 32768', value: 'MIXTRAL_8X7B_32768' },
            ]
          case 'gemini':
            return [
              { name: 'Gemini 1.5 Flash', value: 'GEMINI_1_5_FLASH' },
              { name: 'Gemini 1.5 Pro', value: 'GEMINI_1_5_PRO' },
            ]
          default:
            return []
        }
      },
      when: (answers: InquirerAnswers) =>
        [
          'llama',
          'ollama',
          'chatgpt',
          'claude',
          'cohere',
          'mistral',
          'octo',
          'fireworks',
          'together',
          'groq',
          'gemini',
        ].includes(answers.llmServices as string),
    },
    {
      type: 'list',
      name: 'transcriptServices',
      message: 'Select the transcription service you want to use:',
      choices: [
        { name: 'Whisper.cpp', value: 'whisper' },
        { name: 'Whisper.cpp (Docker)', value: 'whisperDocker' },
        { name: 'Whisper Python', value: 'whisperPython' },
        { name: 'Whisper Diarization', value: 'whisperDiarization' },
        { name: 'Deepgram', value: 'deepgram' },
        { name: 'AssemblyAI', value: 'assembly' },
      ],
    },
    {
      type: 'list',
      name: 'whisperModel',
      message: 'Select the Whisper model type:',
      choices: [
        'tiny',
        'tiny.en',
        'base',
        'base.en',
        'small',
        'small.en',
        'medium',
        'medium.en',
        'large-v1',
        'large-v2',
        'turbo',
      ],
      when: (answers: InquirerAnswers) =>
        ['whisper', 'whisperDocker', 'whisperPython', 'whisperDiarization'].includes(
          answers.transcriptServices as string
        ),
      default: 'large-v2',
    },
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
    {
      type: 'confirm',
      name: 'confirmAction',
      message: 'Proceed with the above configuration?',
      default: true,
    },
  ])

  // If user cancels the action
  if (!answers.confirmAction) {
    log('Operation cancelled.')
    process.exit(0)
  }

  // Merge answers into options
  options = {
    ...options,
    ...answers,
  } as ProcessingOptions

  // Handle transcription options
  if (answers.transcriptServices) {
    if (
      ['whisper', 'whisperDocker', 'whisperPython', 'whisperDiarization'].includes(
        answers.transcriptServices
      )
    ) {
      // Assign the Whisper model
      (options as any)[answers.transcriptServices] = answers.whisperModel as WhisperModelType
    } else if (answers.transcriptServices === 'deepgram' || answers.transcriptServices === 'assembly') {
      // Assign boolean true for these services
      (options as any)[answers.transcriptServices] = true
    }
  }

  // Handle LLM options
  if (answers.llmServices) {
    if (answers.llmModel) {
      (options as any)[answers.llmServices] = answers.llmModel
    } else {
      (options as any)[answers.llmServices] = true
    }
  }

  // Handle 'item' for RSS feed
  if (typeof answers.item === 'string') {
    options.item = answers.item.split(',').map((item) => item.trim())
  }

  // Remove unnecessary properties
  const keysToRemove = ['action', 'specifyItem', 'confirmAction', 'llmModel', 'whisperModel']
  keysToRemove.forEach((key) => delete options[key as keyof typeof options])

  return options
}