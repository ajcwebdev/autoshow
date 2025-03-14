// src/transcription/whisper-utils.ts

import { l, err } from '../utils/logging'
import { execPromise, existsSync } from '../utils/node-utils'

import type { WhisperOutput } from '../utils/types'

export function formatTimestamp(timestamp: string) {
  const [timeWithoutMs] = timestamp.split(',') as [string]
  return timeWithoutMs
}

export function formatWhisperTranscript(jsonData: WhisperOutput) {
  const transcripts = jsonData.transcription
  const chunks = []

  for (let i = 0; i < transcripts.length; i += 35) {
    const chunk = transcripts.slice(i, i + 35)
    const firstChunk = chunk[0]!
    const combinedText = chunk.map(item => item.text).join('')
    chunks.push({
      timestamp: formatTimestamp(firstChunk.timestamps.from),
      text: combinedText
    })
  }

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