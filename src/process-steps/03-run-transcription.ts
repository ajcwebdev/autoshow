// src/process-steps/03-run-transcription.ts

import { callWhisper } from '../transcription/whisper.ts'
import { callDeepgram } from '../transcription/deepgram.ts'
import { callAssembly } from '../transcription/assembly.ts'
import { retryTranscriptionCall, logTranscriptionCost } from './03-run-transcription-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { validateTranscriptionService, getTranscriptionModelConfig } from '../utils/service-config.ts'
import type { ProcessingOptions, TranscriptionResult } from '../../shared/types.ts'

export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  transcriptServices?: string
) {
  l.step(`\nStep 3 - Run Transcription\n`)
  logInitialFunctionCall('runTranscription', { options, finalPath, transcriptServices })
  
  // Validate the transcription service and model
  const { service, modelId, isValid } = validateTranscriptionService(options, transcriptServices)
  
  if (!isValid || !service) {
    throw new Error(`Invalid transcription configuration`)
  }
  
  let finalTranscript = ''
  let finalCostPerMinuteCents = 0
  
  try {
    // Get the model configuration
    const modelConfig = getTranscriptionModelConfig(service, modelId)
    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${service}:${modelId}`)
    }
    
    finalCostPerMinuteCents = modelConfig.costPerMinuteCents
    
    // Call the appropriate transcription service
    switch (service) {
      case 'deepgram': {
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callDeepgram(options, finalPath, modelId)
        )
        l.dim('\n  Deepgram transcription completed successfully.\n')
        finalTranscript = result.transcript
        break
      }
      case 'assembly': {
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callAssembly(options, finalPath, modelId)
        )
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        finalTranscript = result.transcript
        break
      }
      case 'whisper': {
        const result = await retryTranscriptionCall<TranscriptionResult>(
          () => callWhisper(options, finalPath, modelId)
        )
        l.dim('\n  Whisper transcription completed successfully.\n')
        finalTranscript = result.transcript
        break
      }
      default:
        throw new Error(`Unknown transcription service: ${service}`)
    }
    
    const transcriptionCost = await logTranscriptionCost({
      modelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${finalPath}.wav`
    })
    
    return {
      transcript: finalTranscript,
      transcriptionCost,
      modelId,
      costPerMinuteCents: finalCostPerMinuteCents
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}