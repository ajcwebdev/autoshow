// src/process-commands/file.ts

import {
  createProcessContext,
  stepGenerateMarkdown,
  stepDownloadAudio,
  stepRunTranscription,
  stepSelectPrompts,
  stepRunLLM
} from '../process-steps/workflow-context.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function processFile(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processFile', { filePath, llmServices, transcriptServices })

  try {
    // Create a context
    const ctx = createProcessContext(options, filePath)

    // Steps
    await stepGenerateMarkdown(ctx)
    await stepDownloadAudio(ctx)
    await stepRunTranscription(ctx, transcriptServices)
    await stepSelectPrompts(ctx)
    await stepRunLLM(ctx, llmServices, transcriptServices)

    // Return final results
    l.dim('\n  processFile command completed successfully.')
    return {
      frontMatter: ctx.frontMatter,
      prompt: ctx.selectedPrompts,
      llmOutput: ctx.llmOutput,
      transcript: ctx.transcript
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}
