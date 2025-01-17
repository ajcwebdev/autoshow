// src/utils/format-transcript.ts

// This file contains utility functions to format transcripts from different transcription services into
// a uniform plain text format with timestamps. It includes:
// - formatDeepgramTranscript: Formats transcripts returned by Deepgram
// - formatAssemblyTranscript: Formats transcripts returned by AssemblyAI
// - formatWhisperTranscript: Converts LRC files to plain text with timestamps

import type {
  AssemblyAIPollingResponse,
  AssemblyAIUtterance,
  AssemblyAIWord
} from '../utils/types/transcription'

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
 * - Collapses lines with single or few words into lines of up to 15 words, retaining only the first timestamp
 *   among collapsed lines and removing subsequent timestamps.
 *
 * @param lrcContent - The content of the LRC file as a string
 * @returns The converted text content with simple timestamps
 */
export function formatWhisperTranscript(lrcContent: string): string {
  const lines = lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[(\d{1,3}):(\d{2})(\.\d+)?\]/g, (_, p1, p2) => `[${p1}:${p2}]`))

  const finalLines: string[] = []
  let currentTimestamp = ''
  let currentWords: string[] = []

  lines.forEach(line => {
    const match = line.match(/^\[(\d{1,3}:\d{2})\]\s*(.*)$/)
    if (match) {
      const timestamp = match[1] || ''
      const text = match[2]
      if (currentWords.length > 0) {
        finalLines.push(`[${currentTimestamp}] ${currentWords.join(' ')}`)
        currentWords = []
      }
      currentTimestamp = timestamp
      const splitted = (text || '').split(/\s+/).filter(Boolean)
      splitted.forEach(word => {
        if (currentWords.length >= 15) {
          finalLines.push(`[${currentTimestamp}] ${currentWords.join(' ')}`)
          currentWords = []
        }
        currentWords.push(word)
      })
    } else {
      const splitted = line.trim().split(/\s+/).filter(Boolean)
      splitted.forEach(word => {
        if (currentWords.length >= 15) {
          finalLines.push(`[${currentTimestamp}] ${currentWords.join(' ')}`)
          currentWords = []
        }
        currentWords.push(word)
      })
    }
  })

  if (currentWords.length > 0) {
    finalLines.push(`[${currentTimestamp}] ${currentWords.join(' ')}`)
  }

  return finalLines.join('\n')
}