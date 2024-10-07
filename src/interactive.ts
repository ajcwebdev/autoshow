// src/inquirer.ts

import inquirer from 'inquirer'
import type { ProcessingOptions, InquirerAnswers, WhisperModelType } from './types.js'
import { log } from './models.js'

/**
 * Prompts the user for input if interactive mode is selected.
 * @param {ProcessingOptions} options - The initial command-line options.
 * @returns {Promise<ProcessingOptions>} - The updated options after user input.
 */
export async function handleInteractivePrompt(options: ProcessingOptions): Promise<ProcessingOptions> {
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
      when: (answers: InquirerAnswers) => answers.action === 'rss',
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
      ],
    },
    {
      type: 'list',
      name: 'llama',
      message: 'Select the LLAMA model you want to use:',
      choices: [
        { name: 'LLAMA 3 8B Q4 Model', value: 'LLAMA_3_1_8B_Q4_MODEL' },
        { name: 'LLAMA 3 8B Q6 Model', value: 'LLAMA_3_1_8B_Q6_MODEL' },
        { name: 'GEMMA 2 2B Q4 Model', value: 'GEMMA_2_2B_Q4_MODEL' },
        { name: 'GEMMA 2 2B Q6 Model', value: 'GEMMA_2_2B_Q6_MODEL' },
      ],
      when: (answers: InquirerAnswers) => answers.llmServices === 'llama',
    },
    {
      type: 'list',
      name: 'transcriptServices',
      message: 'Select the transcription service you want to use:',
      choices: [
        { name: 'Whisper.cpp', value: 'whisper' },
        { name: 'Whisper.cpp (Docker)', value: 'whisperDocker' },
        { name: 'Deepgram', value: 'deepgram' },
        { name: 'AssemblyAI', value: 'assembly' },
      ],
    },
    {
      type: 'list',
      name: 'whisperModel',
      message: 'Select the Whisper model type:',
      choices: ['tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'medium.en', 'large-v1', 'large-v2'],
      when: (answers: InquirerAnswers) => answers.transcriptServices === 'whisper' || answers.transcriptServices === 'whisperDocker',
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

  options = {
    ...options,
    ...answers,
  } as ProcessingOptions

  // Handle transcription options
  if (answers.transcriptServices) {
    if (answers.transcriptServices === 'whisper' || answers.transcriptServices === 'whisperDocker') {
      options[answers.transcriptServices] = answers.whisperModel as WhisperModelType
    } else {
      options[answers.transcriptServices] = true
    }
  }

  // Handle 'item' for RSS feed
  if (typeof answers.item === 'string') {
    options.item = answers.item.split(',').map(item => item.trim())
  }

  // Remove unnecessary properties
  const keysToRemove = ['action', 'specifyItem', 'confirmAction']
  keysToRemove.forEach(key => delete options[key as keyof typeof options])

  return options
}