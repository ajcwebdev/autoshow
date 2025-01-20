// src/utils/globals.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { processVideo } from '../../process-commands/video'
import { processPlaylist } from '../../process-commands/playlist'
import { processChannel } from '../../process-commands/channel'
import { processURLs } from '../../process-commands/urls'
import { processFile } from '../../process-commands/file'
import { processRSS } from '../../process-commands/rss'

import type { ValidAction, HandlerFunction } from '../types/process'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

/* ------------------------------------------------------------------
 * Prompt & Action Choices
 * ------------------------------------------------------------------ */

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
 * Provides user-friendly prompt choices for content generation or summary tasks.
 * 
 */
export const PROMPT_CHOICES: Array<{ name: string; value: string }> = [
  { name: 'Titles', value: 'titles' },
  { name: 'Summary', value: 'summary' },
  { name: 'Short Summary', value: 'shortSummary' },
  { name: 'Long Summary', value: 'longSummary' },
  { name: 'Bullet Point Summary', value: 'bulletPoints' },
  { name: 'Short Chapters', value: 'shortChapters' },
  { name: 'Medium Chapters', value: 'mediumChapters' },
  { name: 'Long Chapters', value: 'longChapters' },
  { name: 'Key Takeaways', value: 'takeaways' },
  { name: 'Questions', value: 'questions' },
  { name: 'FAQ', value: 'faq' },
  { name: 'Blog', value: 'blog' },
  { name: 'Rap Song', value: 'rapSong' },
  { name: 'Rock Song', value: 'rockSong' },
  { name: 'Country Song', value: 'countrySong' },
]

/**
 * Available action options for content processing with additional metadata.
 * 
 */
export const ACTION_OPTIONS: Array<{
  name: string
  description: string
  message: string
  validate: (input: string) => boolean | string
}> = [
  {
    name: 'video',
    description: 'Single YouTube Video',
    message: 'Enter the YouTube video URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'playlist',
    description: 'YouTube Playlist',
    message: 'Enter the YouTube playlist URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'channel',
    description: 'YouTube Channel',
    message: 'Enter the YouTube channel URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
  {
    name: 'urls',
    description: 'List of URLs from File',
    message: 'Enter the file path containing URLs:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'file',
    description: 'Local Audio/Video File',
    message: 'Enter the local audio/video file path:',
    validate: (input: string) =>
      (input ? true : 'Please enter a valid file path.'),
  },
  {
    name: 'rss',
    description: 'Podcast RSS Feed',
    message: 'Enter the podcast RSS feed URL:',
    validate: (input: string) => (input ? true : 'Please enter a valid URL.'),
  },
]