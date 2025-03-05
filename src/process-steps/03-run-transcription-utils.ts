// src/process-steps/03-run-transcription-utils.ts

import { l, err } from '../utils/logging'
import { execPromise, existsSync } from '../utils/node-utils'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants'

import type { ProcessingOptions, WhisperOutput } from '../utils/types'

/**
 * Retries a given transcription call with an exponential backoff of 7 attempts (1s initial delay).
 * 
 * @param {() => Promise<string>} fn - The function to execute for the transcription call
 * @returns {Promise<string>} Resolves when the function succeeds or rejects after 7 attempts
 * @throws {Error} If the function fails after all attempts
 */
export async function retryTranscriptionCall(
  fn: () => Promise<string>
) {
  const maxRetries = 7
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      const transcript = await fn()
      l.dim(`  Transcription call completed successfully on attempt ${attempt}.`)
      return transcript
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting transcription.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error('Transcription call failed after maximum retries.')
}

/**
 * Asynchronously logs the estimated transcription cost based on audio duration and per-minute cost.
 * Internally calculates the audio file duration using ffprobe.
 * @param info - Object containing transcription information with the following properties:
 * @param info.modelName - The name of the model being used
 * @param info.costPerMinuteCents - The new cost (in cents) per minute
 * @param info.filePath - The file path to the audio file
 * @throws {Error} If ffprobe fails or returns invalid data.
 */
export async function logTranscriptionCost(info: {
  modelName: string;
  costPerMinuteCents?: number;
  filePath: string;
}) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const costPerMin = info.costPerMinuteCents ?? 0
  const cost = costPerMin * minutes

  l.dim(
    `  - Estimated Transcription Cost for ${info.modelName}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: ¢${cost.toFixed(5)}`
  )
}

/**
 * Estimates transcription cost for the provided file and chosen transcription service.
 * 
 * @param {ProcessingOptions} options - The command-line options (must include `transcriptCost` file path).
 * @param {string} transcriptServices - The selected transcription service (e.g., "deepgram", "assembly", "whisper").
 * @returns {Promise<void>} A promise that resolves when cost estimation is complete.
 */
export async function estimateTranscriptCost(
  options: ProcessingOptions,
  transcriptServices: string
) {
  const filePath = options.transcriptCost
  if (!filePath) throw new Error('No file path provided to estimate transcription cost.')

  if (transcriptServices === 'whisper') {
    return l.wait('\nNo cost data available for Whisper.\n')
  }

  if (!['deepgram', 'assembly'].includes(transcriptServices)) {
    throw new Error(`Unsupported transcription service: ${transcriptServices}`)
  }
  
  const config = TRANSCRIPTION_SERVICES_CONFIG[transcriptServices as 'deepgram' | 'assembly']
  const optionValue = options[transcriptServices as 'deepgram' | 'assembly'] as string
  const defaultModelId = transcriptServices === 'deepgram' ? 'NOVA_2' : 'NANO'
  const modelInput = typeof optionValue === 'string' ? optionValue : defaultModelId
  const normalizedModelId = modelInput.toLowerCase()
  const model = config.models.find(m => m.modelId.toLowerCase() === normalizedModelId)

  if (!model) throw new Error(`Model not found for: ${modelInput}`)

  await logTranscriptionCost({
    modelName: model.name,
    costPerMinuteCents: model.costPerMinuteCents,
    filePath
  })
}

/**
 * Formats the Deepgram transcript by adding timestamps and newlines based on conditions.
 * Rules:
 * - Add a timestamp if it's the first word, every 30th word, or the start of a sentence (capitalized word).
 * - Insert a newline if the word ends a sentence (ends in punctuation), every 30th word, or it's the last word.
 *
 * @param words - The array of word objects from Deepgram (each contains a 'word' and 'start' time)
 * @returns A formatted transcript string with timestamps and newlines
 */
export function formatDeepgramTranscript(words: Array<{ word: string; start: number }>) {
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
export function formatAssemblyTranscript(transcript: any, speakerLabels: boolean) {
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

export function formatTimestamp(timestamp: string) {
  const [timeWithoutMs] = timestamp.split(',') as [string]
  return timeWithoutMs
}

export function formatWhisperTranscript(jsonData: WhisperOutput) {
  const transcripts = jsonData.transcription
  const chunks = []

  // Process in chunks of 10
  for (let i = 0; i < transcripts.length; i += 35) {
    const chunk = transcripts.slice(i, i + 35)
    const firstChunk = chunk[0]!
    const combinedText = chunk.map(item => item.text).join('')
    chunks.push({
      timestamp: formatTimestamp(firstChunk.timestamps.from),
      text: combinedText
    })
  }

  // Generate the output text
  return chunks
    .map(chunk => `[${chunk.timestamp}] ${chunk.text}`)
    .join('\n')
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
) {
  if (whisperModel === 'turbo') whisperModel = 'large-v3-turbo'

  const whisperDir = './whisper.cpp'
  const whisperCliPath = `${whisperDir}/build/bin/whisper-cli`
  const modelPath = `${whisperDir}/models/${modelGGMLName}`
  
  // Clone and build whisper.cpp if missing
  if (!existsSync(whisperDir)) {
    l.dim(`\n  No whisper.cpp repo found, cloning and compiling...\n`)
    try {
      await execPromise(
        `git clone https://github.com/ggerganov/whisper.cpp.git && ` +
        `cmake -B ${whisperDir}/build -S ${whisperDir} && ` +
        `cmake --build ${whisperDir}/build --config Release`
      )
      l.dim(`\n    - whisper.cpp clone and compilation complete.\n`)
    } catch (error) {
      err(`Error cloning/building whisper.cpp: ${(error as Error).message}`)
      throw error
    }
  } else {
    // Rebuild if binary is missing
    l.dim(`\n  Whisper.cpp repo is already available at:\n    - ${whisperDir}\n`)
    if (!existsSync(whisperCliPath)) {
      l.dim(`\n  No whisper-cli binary found, rebuilding...\n`)
      try {
        await execPromise(
          `cmake -B ${whisperDir}/build -S ${whisperDir} && ` +
          `cmake --build ${whisperDir}/build --config Release`
        )
        l.dim(`\n    - whisper.cpp build completed.\n`)
      } catch (error) {
        err(`Error rebuilding whisper.cpp: ${(error as Error).message}`)
        throw error
      }
    } else {
      l.dim(`  Found whisper-cli at:\n    - ${whisperCliPath}\n`)
    }
  }
  // Download model if missing
  if (!existsSync(modelPath)) {
    l.dim(`\n  Model not found locally, attempting download...\n    - ${whisperModel}\n`)
    try {
      await execPromise(
        `bash ${whisperDir}/models/download-ggml-model.sh ${whisperModel}`,
        { maxBuffer: 10000 * 1024 }
      )
      l.dim('    - Model download completed.\n')
    } catch (error) {
      err(`Error downloading model: ${(error as Error).message}`)
      throw error
    }
  } else {
    l.dim(`  Model "${whisperModel}" is already available at:\n    - ${modelPath}\n`)
  }
}