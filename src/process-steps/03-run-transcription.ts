// src/process-steps/03-run-transcription.ts

/**
 * Orchestrates the transcription process using the specified service.
 * Now returns an object that includes both the transcript string and its calculated cost.
 */

import { callWhisper } from '../transcription/whisper.ts'
import { callDeepgram } from '../transcription/deepgram.ts'
import { callAssembly } from '../transcription/assembly.ts'
import { retryTranscriptionCall, logTranscriptionCost } from './03-run-transcription-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'

import type { ProcessingOptions, TranscriptionResult } from '../utils/types.ts'

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
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callDeepgram(options, finalPath)
        )
        l.dim('\n  Deepgram transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

      case 'assembly': {
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callAssembly(options, finalPath)
        )
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

      case 'whisper': {
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callWhisper(options, finalPath)
        )
        l.dim('\n  Whisper transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }

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