// src/utils/transcription-utils.ts

/**
 * @file Defines Deepgram and Assembly transcription model configurations,
 * including name, modelId, and cost per minute. Also provides
 * Whisper model mappings for whisper.cpp usage.
 */

import { existsSync } from 'node:fs'
import { execPromise } from '../validate-option'
import { l, err } from '../logging'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices, TranscriptionCostInfo, WhisperModelType, TranscriptServiceConfig, DeepgramModelType, AssemblyModelType, AssemblyAIPollingResponse, AssemblyAIUtterance, AssemblyAIWord } from '../types/transcription'

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

/**
 * Asynchronously logs the estimated transcription cost based on audio duration and per-minute cost.
 * Internally calculates the audio file duration using ffprobe.
 * @param info - Object containing the model name, cost per minute, and path to the audio file.
 * @throws {Error} If ffprobe fails or returns invalid data.
 */
export async function logTranscriptionCost(info: TranscriptionCostInfo): Promise<void> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const cost = info.costPerMinute * minutes

  l.dim(
    `  - Estimated Transcription Cost for ${info.modelName}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: $${cost.toFixed(4)}`
  )
}

/**
 * Estimates transcription cost for the provided file and chosen transcription service.
 * 
 * @param {ProcessingOptions} options - The command-line options (must include `transcriptCost` file path).
 * @param {TranscriptServices} transcriptServices - The selected transcription service (e.g., "deepgram", "assembly", "whisper").
 * @returns {Promise<void>} A promise that resolves when cost estimation is complete.
 */
export async function estimateTranscriptCost(
  options: ProcessingOptions,
  transcriptServices: TranscriptServices
): Promise<void> {
  const filePath = options.transcriptCost
  if (!filePath) {
    throw new Error('No file path provided to estimate transcription cost.')
  }

  switch (transcriptServices) {
    case 'deepgram': {
      const deepgramModel = typeof options.deepgram === 'string' ? options.deepgram : 'NOVA_2'
      const modelInfo = DEEPGRAM_MODELS[deepgramModel as DeepgramModelType] || DEEPGRAM_MODELS.NOVA_2
      await logTranscriptionCost({
        modelName: modelInfo.name,
        costPerMinute: modelInfo.costPerMinute,
        filePath
      })
      break
    }
    case 'assembly': {
      const assemblyModel = typeof options.assembly === 'string' ? options.assembly : 'NANO'
      const modelInfo = ASSEMBLY_MODELS[assemblyModel as AssemblyModelType] || ASSEMBLY_MODELS.NANO
      await logTranscriptionCost({
        modelName: modelInfo.name,
        costPerMinute: modelInfo.costPerMinute,
        filePath
      })
      break
    }
    case 'whisper': {
      // Currently, no official cost data for Whisper.cpp
      l.wait('\nNo cost data available for Whisper.\n')
      break
    }
    default: {
      throw new Error(`Unsupported transcription service for cost estimation: ${transcriptServices}`)
    }
  }
}

/* ------------------------------------------------------------------
 * Transcription Services & Models
 * ------------------------------------------------------------------ */

/**
 * Available transcription services and their configuration.
 */
export const TRANSCRIPT_SERVICES: Record<string, TranscriptServiceConfig> = {
  WHISPER: { name: 'Whisper.cpp', value: 'whisper', isWhisper: true },
  DEEPGRAM: { name: 'Deepgram', value: 'deepgram' },
  ASSEMBLY: { name: 'AssemblyAI', value: 'assembly' },
} as const

/**
 * Array of valid transcription service values.
 */
export const TRANSCRIPT_OPTIONS: string[] = Object.values(TRANSCRIPT_SERVICES)
  .map((service) => service.value)

/**
 * Whisper-only transcription services (subset of TRANSCRIPT_SERVICES).
 */
export const WHISPER_SERVICES: string[] = Object.values(TRANSCRIPT_SERVICES)
  .filter(
    (
      service
    ): service is TranscriptServiceConfig & {
      isWhisper: true
    } => service.isWhisper === true
  )
  .map((service) => service.value)

/**
 * Mapping of Whisper model flags (`--whisper=<model>`) to the actual
 * ggml binary filenames for whisper.cpp.
 */
export const WHISPER_MODELS: Record<WhisperModelType, string> = {
  // Tiny models
  tiny: 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',

  // Base models
  base: 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',

  // Small/Medium
  small: 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  medium: 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',

  // Large variations
  'large-v1': 'ggml-large-v1.bin',
  'large-v2': 'ggml-large-v2.bin',

  // Add or rename as needed:
  'large-v3-turbo': 'ggml-large-v3-turbo.bin',
  // Provide an alias if you like shorter flags:
  turbo: 'ggml-large-v3-turbo.bin',
}

/**
 * Deepgram models with their per-minute cost.
 */
export const DEEPGRAM_MODELS: Record<
  DeepgramModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
  NOVA_2: {
    name: 'Nova-2',
    modelId: 'nova-2',
    costPerMinute: 0.0043,
  },
  NOVA: {
    name: 'Nova',
    modelId: 'nova',
    costPerMinute: 0.0043,
  },
  ENHANCED: {
    name: 'Enhanced',
    modelId: 'enhanced',
    costPerMinute: 0.0145,
  },
  BASE: {
    name: 'Base',
    modelId: 'base',
    costPerMinute: 0.0125,
  },
}

/**
 * AssemblyAI models with their per-minute cost.
 */
export const ASSEMBLY_MODELS: Record<
  AssemblyModelType,
  { name: string; modelId: string; costPerMinute: number }
> = {
  BEST: {
    name: 'Best',
    modelId: 'best',
    costPerMinute: 0.0062,
  },
  NANO: {
    name: 'Nano',
    modelId: 'nano',
    costPerMinute: 0.002,
  },
}


/**
 * Checks if whisper.cpp directory exists and, if missing, clones and compiles it.
 * Also checks if the chosen model file is present and, if missing, downloads it.
 * @param whisperModel - The requested Whisper model name (e.g. "turbo" or "large-v3-turbo")
 * @param modelGGMLName - The corresponding GGML model filename (e.g. "ggml-large-v3-turbo.bin")
 */
export async function checkWhisperDirAndModel(
  whisperModel: string,
  modelGGMLName: string
): Promise<void> {
  // OPTIONAL: If you want to handle "turbo" as an alias for "large-v3-turbo"
  // so the user can do --whisper=turbo but the script sees "large-v3-turbo".
  if (whisperModel === 'turbo') {
    whisperModel = 'large-v3-turbo'
  }

  // Double-check that the requested model is actually in WHISPER_MODELS,
  // to avoid passing an unrecognized name to download-ggml-model.sh
  if (!Object.prototype.hasOwnProperty.call(WHISPER_MODELS, whisperModel)) {
    throw new Error(
      `Unknown Whisper model "${whisperModel}". ` +
      `Please use one of: ${Object.keys(WHISPER_MODELS).join(', ')}`
    )
  }

  // 1. Ensure whisper.cpp is cloned and built
  if (!existsSync('./whisper.cpp')) {
    l.dim(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    try {
      await execPromise(
        'git clone https://github.com/ggerganov/whisper.cpp.git ' +
        '&& cmake -B whisper.cpp/build -S whisper.cpp ' +
        '&& cmake --build whisper.cpp/build --config Release'
      )
      l.dim(`\n    - whisper.cpp clone and compilation complete.\n`)
    } catch (cloneError) {
      err(`Error cloning/building whisper.cpp: ${(cloneError as Error).message}`)
      throw cloneError
    }
  } else {
    l.dim(`\n  Whisper.cpp repo is already available at:\n    - ./whisper.cpp\n`)
  }

  // Also check for whisper-cli binary, just in case
  const whisperCliPath = './whisper.cpp/build/bin/whisper-cli'
  if (!existsSync(whisperCliPath)) {
    l.dim(`\n  No whisper-cli binary found, rebuilding...\n`)
    try {
      await execPromise(
        'cmake -B whisper.cpp/build -S whisper.cpp ' +
        '&& cmake --build whisper.cpp/build --config Release'
      )
      l.dim(`\n    - whisper.cpp build completed.\n`)
    } catch (buildError) {
      err(`Error (re)building whisper.cpp: ${(buildError as Error).message}`)
      throw buildError
    }
  } else {
    l.dim(`  Found whisper-cli at:\n    - ${whisperCliPath}\n`)
  }

  // 2. Make sure the chosen model file is present
  const modelPath = `./whisper.cpp/models/${modelGGMLName}`
  if (!existsSync(modelPath)) {
    l.dim(`\n  Model not found locally, attempting download...\n    - ${whisperModel}\n`)
    try {
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModel}`)
      l.dim('    - Model download completed.\n')
    } catch (modelError) {
      err(`Error downloading model: ${(modelError as Error).message}`)
      throw modelError
    }
  } else {
    l.dim(
      `  Model "${whisperModel}" is already available at:\n` +
      `    - ${modelPath}\n`
    )
  }
}