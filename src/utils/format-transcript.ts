// src/utils/format-transcript.ts

// This file contains utility functions to format transcripts from different transcription services into
// a uniform plain text format with timestamps. It includes:
// - formatDeepgramTranscript: Formats transcripts returned by Deepgram
// - formatAssemblyTranscript: Formats transcripts returned by AssemblyAI
// - lrcToTxt: Converts LRC (lyrics) files to plain text with timestamps
// - srtToTxt: Converts SRT subtitle files to plain text with timestamps

import type {
  AssemblyAIPollingResponse,
  AssemblyAIUtterance,
  AssemblyAIWord
} from '../types/transcription'

/**
 * Formats the Deepgram transcript by adding timestamps and newlines based on conditions.
 * Rules:
 * - Add a timestamp if it's the first word, every 30th word, or the start of a sentence (capitalized word).
 * - Insert a newline if the word ends a sentence (ends in punctuation), every 30th word, or it's the last word.
 *
 * @param words - The array of word objects from Deepgram (each contains a 'word' and 'start' time)
 * @returns A formatted transcript string with timestamps and newlines
 */
export function formatDeepgramTranscript(words: Array<{ word: string; start: number }>): string {
  return words.reduce((acc, { word, start }, i, arr) => {
    const addTimestamp = (i % 30 === 0 || /^[A-Z]/.test(word))
    let timestamp = ''
    if (addTimestamp) {
      const minutes = Math.floor(start / 60).toString().padStart(2, '0')
      const seconds = Math.floor(start % 60).toString().padStart(2, '0')
      timestamp = `[${minutes}:${seconds}] `
    }

    const endOfSentence = /[.!?]$/.test(word)
    const endOfBlock = (i % 30 === 29 || i === arr.length - 1)
    const newline = (endOfSentence || endOfBlock) ? '\n' : ''

    return `${acc}${timestamp}${word} ${newline}`
  }, '')
}

/**
 * Formats the AssemblyAI transcript into text with timestamps and optional speaker labels.
 * Logic:
 * - If transcript.utterances are present, format each utterance line with optional speaker labels and timestamps.
 * - If only transcript.words are available, group them into lines ~80 chars, prepend each line with a timestamp.
 * - If no structured data is available, use the raw transcript text or 'No transcription available.' as fallback.
 *
 * @param transcript - The polling response from AssemblyAI after transcription completes
 * @param speakerLabels - Whether to include speaker labels in the output
 * @returns The fully formatted transcript as a string
 * @throws If words are expected but not found (no content to format)
 */
export function formatAssemblyTranscript(transcript: AssemblyAIPollingResponse, speakerLabels: boolean): string {
  // Helper inline formatting function for timestamps (AssemblyAI returns ms)
  const inlineFormatTime = (timestamp: number): string => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const seconds = (totalSeconds % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  let txtContent = ''

  if (transcript.utterances && transcript.utterances.length > 0) {
    // If utterances are available, format each line with optional speaker labels and timestamps
    txtContent = transcript.utterances.map((utt: AssemblyAIUtterance) =>
      `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${inlineFormatTime(utt.start)}): ${utt.text}`
    ).join('\n')
  } else if (transcript.words && transcript.words.length > 0) {
    // If only words are available, we must form lines with timestamps every ~80 chars
    const firstWord = transcript.words[0]
    if (!firstWord) {
      throw new Error('No words found in transcript')
    }

    let currentLine = ''
    let currentTimestamp = inlineFormatTime(firstWord.start)

    transcript.words.forEach((word: AssemblyAIWord) => {
      if (currentLine.length + word.text.length > 80) {
        // Start a new line if the current line exceeds ~80 characters
        txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
        currentLine = ''
        currentTimestamp = inlineFormatTime(word.start)
      }
      currentLine += `${word.text} `
    })

    // Add any remaining text as a final line
    if (currentLine.length > 0) {
      txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
    }
  } else {
    // If no utterances or words, fallback to transcript.text or a default message
    txtContent = transcript.text || 'No transcription available.'
  }

  return txtContent
}

/**
 * Converts LRC content (common lyrics file format) to plain text with timestamps.
 * - Strips out lines that contain certain metadata (like [by:whisper.cpp]).
 * - Converts original timestamps [MM:SS.xx] to a simplified [MM:SS] format.
 *
 * @param lrcContent - The content of the LRC file as a string
 * @returns The converted text content with simple timestamps
 */
export function lrcToTxt(lrcContent: string): string {
  return lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (_, p1, p2) => `[${p1}:${p2}]`))
    .join('\n')
}

/**
 * Converts SRT subtitle content to plain text with timestamps.
 * - Extracts timestamp lines (HH:MM:SS,ms) and converts them into [MM:SS] format.
 * - Joins subtitle text lines into a single line per block.
 *
 * @param srtContent - The content of the SRT file as a string
 * @returns The converted text content with simplified timestamps
 */
export function srtToTxt(srtContent: string): string {
  const blocks = srtContent.split('\n\n')
  return blocks
    .map(block => {
      const lines = block.split('\n').filter(line => line.trim() !== '')
      if (lines.length < 2) return null

      const timestampLine = lines[1]
      const textLines = lines.slice(2)

      const match = timestampLine?.match(/(\d{2}):(\d{2}):(\d{2}),\d{3}/)
      if (!match?.[1] || !match?.[2] || !match?.[3]) return null

      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const seconds = match[3]
      const totalMinutes = hours * 60 + minutes
      const timestamp = `[${String(totalMinutes).padStart(2, '0')}:${seconds}]`
      const text = textLines.join(' ')

      return `${timestamp} ${text}`
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}