// src/transcription/whisper.ts

import { checkWhisperDirAndModel, formatWhisperTranscript } from './whisper-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, unlink, execPromise } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions, WhisperOutput } from '../utils/types.ts'

/**
 * Main function to handle transcription using local Whisper.cpp.
 * @param {ProcessingOptions} options - Processing options that determine how transcription is run.
 * @param {string} finalPath - The base filename (without extension) for input and output files.
 * @returns {Promise<TranscriptionResult>}
 */
export async function callWhisper(
  options: ProcessingOptions,
  finalPath: string
) {
  l.opts('\n  callWhisper called with arguments:')
  l.opts(`    - finalPath: ${finalPath}`)

  try {
    const whisperModel = typeof options.whisper === 'string'
      ? options.whisper
      : options.whisper === true
        ? 'base'
        : (() => { throw new Error('Invalid whisper option') })()

    const whisperModels = TRANSCRIPTION_SERVICES_CONFIG.whisper.models
    const chosenModel = whisperModels.find(m => m.modelId === whisperModel)
      ?? (() => { throw new Error(`Unknown model type: ${whisperModel}`) })()

    const { modelId, costPerMinuteCents } = chosenModel

    const modelGGMLName = `ggml-${modelId}.bin`

    await checkWhisperDirAndModel(modelId, modelGGMLName)

    l.dim(`  Invoking whisper.cpp on file:\n    - ${finalPath}.wav`)
    try {
      await execPromise(
        `./whisper.cpp/build/bin/whisper-cli --no-gpu ` +
        `-m "whisper.cpp/models/${modelGGMLName}" ` +
        `-f "${finalPath}.wav" ` +
        `-of "${finalPath}" ` +
        `-ml 1 ` +
        `--threads 6 ` +
        `--processors 2 ` +
        `--output-json`,
        { maxBuffer: 10000 * 1024 }
      )
    } catch (whisperError) {
      err(`Error running whisper.cpp: ${(whisperError as Error).message}`)
      throw whisperError
    }

    l.dim(`\n  Transcript JSON file successfully created, reading file for txt conversion:\n    - ${finalPath}.json\n`)
    const jsonContent = await readFile(`${finalPath}.json`, 'utf8')
    const parsedJson = JSON.parse(jsonContent) as WhisperOutput
    const txtContent = formatWhisperTranscript(parsedJson)
    await unlink(`${finalPath}.json`)

    return {
      transcript: txtContent,
      modelId,
      costPerMinuteCents
    }
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    process.exit(1)
  }
}