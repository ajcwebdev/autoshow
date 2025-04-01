// src/transcription/whisper.ts

import { checkWhisperDirAndModel, formatWhisperTranscript } from './whisper-utils.ts'
import { l, err } from '../utils/logging.ts'
import { readFile, unlink, execPromise } from '../utils/node-utils.ts'
import { getTranscriptionModelConfig } from '../utils/service-config.ts'
import type { ProcessingOptions, WhisperOutput } from '../../shared/types.ts'

export async function callWhisper(
  _options: ProcessingOptions,
  finalPath: string,
  modelId: string
) {
  l.opts('\n  callWhisper called with arguments:')
  l.opts(`    - finalPath: ${finalPath}`)
  l.opts(`    - modelId: ${modelId}`)
  
  try {
    // Get model configuration
    const modelConfig = getTranscriptionModelConfig('whisper', modelId)
    if (!modelConfig) {
      throw new Error(`Unknown whisper model: ${modelId}`)
    }
    
    const { costPerMinuteCents } = modelConfig
    const modelGGMLName = `ggml-${modelId}.bin`
    
    // Check whisper directory and model
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
    
    // Clean up temp file
    await unlink(`${finalPath}.json`)
    
    return {
      transcript: txtContent,
      modelId,
      costPerMinuteCents
    }
  } catch (error) {
    err('Error in callWhisper:', (error as Error).message)
    throw error
  }
}