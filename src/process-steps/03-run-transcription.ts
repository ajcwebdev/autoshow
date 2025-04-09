// src/process-steps/03-run-transcription.ts

import { callWhisper } from '../transcription/whisper.ts'
import { callDeepgram } from '../transcription/deepgram.ts'
import { callAssembly } from '../transcription/assembly.ts'
// import { callGroq } from '../transcription/groq.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execPromise } from '../utils/node-utils.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices?: string
) {
  l.step(`\nStep 3 - Run Transcription\n`)
  logInitialFunctionCall('runTranscription', { options, finalPath, transcriptServices })

  let finalTranscript = ''
  let finalModelId = ''
  let finalCostPerMinuteCents = 0

  try {
    switch (transcriptServices) {
      case 'deepgram': {
        const result = await retryTranscriptionCall(
          () => callDeepgram(options, finalPath)
        )
        l.dim('\n  Deepgram transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

      case 'assembly': {
        const result = await retryTranscriptionCall(
          () => callAssembly(options, finalPath)
        )
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

      case 'whisper': {
        const result = await retryTranscriptionCall(
          () => callWhisper(options, finalPath)
        )
        l.dim('\n  Whisper transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

      // case 'groq': {
      //   const result = await retryTranscriptionCall(() => callGroq(options, finalPath))
      //   l.dim('\n  Groq transcription completed successfully.\n')
      //   finalTranscript = result.transcript
      //   finalModelId = result.modelId
      //   finalCostPerMinuteCents = result.costPerMinuteCents
      //   break
      // }

      default:
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }

    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${finalPath}.wav`
    })

    return {
      transcript: finalTranscript,
      transcriptionCost,
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}

export async function retryTranscriptionCall<T>(
  fn: () => Promise<T>
) {
  const maxRetries = 7
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      const result = await fn()
      l.dim(`  Transcription call completed successfully on attempt ${attempt}.`)
      return result
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

export async function logTranscriptionCost(info: {
  modelId: string
  costPerMinuteCents: number
  filePath: string
}) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const cost = info.costPerMinuteCents * minutes

  l.dim(
    `  - Estimated Transcription Cost for ${info.modelId}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: ¢${cost.toFixed(5)}`
  )

  return cost
}