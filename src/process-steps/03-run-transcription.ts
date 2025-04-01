// src/process-steps/03-run-transcription.ts

import { callWhisper } from '../transcription/whisper.ts'
import { callDeepgram } from '../transcription/deepgram.ts'
import { callAssembly } from '../transcription/assembly.ts'
import { retryTranscriptionCall, logTranscriptionCost } from './03-run-transcription-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
// import { computeTranscriptionCost } from '../utils/cost-calculator.ts'
import type { ProcessingOptions, TranscriptionResult } from '../../shared/types.ts'

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

    // Log estimated cost for user
    const filePath = `${finalPath}.wav`
    const cost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath
    })

    return {
      transcript: finalTranscript,
      transcriptionCost: cost,
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}
