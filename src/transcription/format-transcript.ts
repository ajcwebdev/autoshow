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
 * - Properly extracts all timestamps in each line, then merges them into
 *   chunks of up to 15 words, adopting the newest timestamp as soon
 *   as it appears.
 *
 * @param lrcContent - The content of the LRC file as a string
 * @returns The converted text content with simple timestamps
 */
export function formatWhisperTranscript(lrcContent: string): string {
  // 1) Remove lines like `[by:whisper.cpp]`, convert "[MM:SS.xx]" to "[MM:SS]"
  const rawLines = lrcContent
    .split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line =>
      line.replace(
        /\[(\d{1,3}):(\d{2})(\.\d+)?\]/g,
        (_, minutes, seconds) => `[${minutes}:${seconds}]`
      )
    )

  // We define a Segment with timestamp: string | undefined
  type Segment = {
    timestamp: string | undefined
    words: string[]
  }

  /**
   * Given a line (which may contain multiple [MM:SS] tags),
   * extract those timestamps + the words in between.
   */
  function parseLineIntoSegments(line: string): Segment[] {
    const segments: Segment[] = []
    const pattern = /\[(\d{1,3}:\d{2})\]/g

    let lastIndex = 0
    let match: RegExpExecArray | null
    let currentTimestamp: string | undefined = undefined

    while ((match = pattern.exec(line)) !== null) {
      // Text before this timestamp
      const textBeforeThisTimestamp = line.slice(lastIndex, match.index).trim()
      if (textBeforeThisTimestamp) {
        segments.push({
          timestamp: currentTimestamp,
          words: textBeforeThisTimestamp.split(/\s+/).filter(Boolean),
        })
      }
      // Update timestamp to the newly found one
      currentTimestamp = match[1]
      lastIndex = pattern.lastIndex
    }

    // After the last timestamp, grab any trailing text
    const trailing = line.slice(lastIndex).trim()
    if (trailing) {
      segments.push({
        timestamp: currentTimestamp,
        words: trailing.split(/\s+/).filter(Boolean),
      })
    }

    // If line had no timestamps, the entire line is one segment with `timestamp: undefined`.
    return segments
  }

  // 2) Flatten all lines into an array of typed segments
  const allSegments: Segment[] = rawLines.flatMap(line => parseLineIntoSegments(line))

  // 3) Accumulate words into lines up to 15 words each.
  //    Whenever we see a new timestamp, we finalize the previous chunk
  //    and start a new chunk with that timestamp.
  const finalLines: string[] = []
  let currentTimestamp: string | undefined = undefined
  let currentWords: string[] = []

  function finalizeChunk() {
    if (currentWords.length > 0) {
      // If we have never encountered a timestamp, default to "00:00"
      const tsToUse = currentTimestamp ?? '00:00'
      finalLines.push(`[${tsToUse}] ${currentWords.join(' ')}`)
      currentWords = []
    }
  }

  for (const segment of allSegments) {
    // If this segment has a new timestamp, finalize the old chunk and start new
    if (segment.timestamp !== undefined) {
      finalizeChunk()
      currentTimestamp = segment.timestamp
    }

    // Accumulate words from this segment, chunking at 15
    for (const word of segment.words) {
      currentWords.push(word)
      if (currentWords.length === 15) {
        finalizeChunk()
      }
    }
  }

  // 4) Finalize any leftover words
  finalizeChunk()

  // 5) Return as simple text
  return finalLines.join('\n')
}