// src/utils/globals.ts

/**
 * @file Defines constants, model mappings, and utility functions used throughout the application.
 * @packageDocumentation
 */

import { XMLParser } from 'fast-xml-parser'
import { exec, execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const execPromise = promisify(exec)
export const execFilePromise = promisify(execFile)

/**
 * Configure XML parser for RSS feed processing.
 * Handles attributes without prefixes and allows boolean values.
 *
 */
export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
})

/* ------------------------------------------------------------------
 * Prompt & Action Choices
 * ------------------------------------------------------------------ */

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

/**
 * Additional CLI flags or options that can be enabled.
 * 
 */
export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'saveAudio',
  'order',
  'skip',
  'info',
  'item',
]