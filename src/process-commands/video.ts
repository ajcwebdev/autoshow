// src/process-commands/video.ts

import {
  createProcessContext,
  stepGenerateMarkdown,
  stepDownloadAudio,
  stepRunTranscription,
  stepSelectPrompts,
  stepRunLLM
} from '../process-steps/workflow-context.ts'

import { err, logInitialFunctionCall } from '../utils/logging.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function processVideo(
  options: ProcessingOptions,
  url: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processVideo', { url, llmServices, transcriptServices })

  try {
    // Create a new process context
    const ctx = createProcessContext(options, url)

    // Execute pipeline steps in order:
    await stepGenerateMarkdown(ctx)
    await stepDownloadAudio(ctx)
    await stepRunTranscription(ctx, transcriptServices)
    await stepSelectPrompts(ctx)
    await stepRunLLM(ctx, llmServices, transcriptServices)

    // Return some data for the caller
    return {
      frontMatter: ctx.frontMatter,
      prompt: ctx.selectedPrompts,
      llmOutput: ctx.llmOutput,
      transcript: ctx.transcript
    }
  } catch (error) {
    err('Error processing video:', (error as Error).message)
    throw error
  }
}
