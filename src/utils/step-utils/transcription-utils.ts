// src/utils/transcription-utils.ts

import { existsSync } from 'node:fs'
import { execPromise } from '../validate-option'
import { l, err } from '../logging'
import { DEEPGRAM_MODELS, ASSEMBLY_MODELS } from '../../../shared/constants'
import type { ProcessingOptions } from '../types/process'
import type { TranscriptServices, TranscriptionCostInfo, DeepgramModelType, AssemblyModelType } from '../types/transcription'

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
export function formatAssemblyTranscript(transcript: any, speakerLabels: boolean): string {
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
    txtContent = transcript.utterances.map((utt: any) =>
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

    transcript.words.forEach((word: any) => {
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

  type Segment = {
    timestamp: string | undefined
    words: string[]
  }

  function parseLineIntoSegments(line: string): Segment[] {
    const segments: Segment[] = []
    const pattern = /\[(\d{1,3}:\d{2})\]/g

    let lastIndex = 0
    let match: RegExpExecArray | null
    let currentTimestamp: string | undefined = undefined

    while ((match = pattern.exec(line)) !== null) {
      const textBeforeThisTimestamp = line.slice(lastIndex, match.index).trim()
      if (textBeforeThisTimestamp) {
        segments.push({
          timestamp: currentTimestamp,
          words: textBeforeThisTimestamp.split(/\s+/).filter(Boolean),
        })
      }
      currentTimestamp = match[1]
      lastIndex = pattern.lastIndex
    }

    const trailing = line.slice(lastIndex).trim()
    if (trailing) {
      segments.push({
        timestamp: currentTimestamp,
        words: trailing.split(/\s+/).filter(Boolean),
      })
    }

    return segments
  }

  const allSegments: Segment[] = rawLines.flatMap(line => parseLineIntoSegments(line))

  const finalLines: string[] = []
  let currentTimestamp: string | undefined = undefined
  let currentWords: string[] = []

  function finalizeChunk() {
    if (currentWords.length > 0) {
      const tsToUse = currentTimestamp ?? '00:00'
      finalLines.push(`[${tsToUse}] ${currentWords.join(' ')}`)
      currentWords = []
    }
  }

  for (const segment of allSegments) {
    if (segment.timestamp !== undefined) {
      finalizeChunk()
      currentTimestamp = segment.timestamp
    }

    for (const word of segment.words) {
      currentWords.push(word)
      if (currentWords.length === 15) {
        finalizeChunk()
      }
    }
  }

  finalizeChunk()
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
      l.wait('\nNo cost data available for Whisper.\n')
      break
    }
    default: {
      throw new Error(`Unsupported transcription service for cost estimation: ${transcriptServices}`)
    }
  }
}

/**
 * Checks if whisper.cpp directory exists and, if missing, clones and compiles it.
 * Also checks if the chosen model file is present and, if missing, downloads it.
 * @param whisperModel - The requested Whisper model name (e.g. "tiny", "base", "turbo", etc.)
 * @param modelGGMLName - The corresponding GGML model filename (e.g. "ggml-base.bin")
 */
export async function checkWhisperDirAndModel(
  whisperModel: string,
  modelGGMLName: string
): Promise<void> {
  if (whisperModel === 'turbo') {
    whisperModel = 'large-v3-turbo'
  }

  // Ensure whisper.cpp is cloned and built if not present
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

  // Check for whisper-cli binary
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

  // Check if the chosen model file is present
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