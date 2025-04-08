// src/process-commands/file.ts

import { generateMarkdown } from '../process-steps/01-generate-markdown.ts'
import { downloadAudio, saveAudio } from '../process-steps/02-download-audio.ts'
import { runTranscription } from '../process-steps/03-run-transcription.ts'
import { selectPrompts } from '../process-steps/04-select-prompt.ts'
import { runLLM } from '../process-steps/05-run-llm.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

export async function processFile(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processFile', { filePath, llmServices, transcriptServices })

  try {
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)
    await downloadAudio(options, filePath, filename)
    const { transcript, transcriptionCost, modelId: transcriptionModel } = await runTranscription(options, finalPath, transcriptServices)
    const selectedPrompts = await selectPrompts(options)
    const { showNote, showNotesResult } = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata as ShowNoteMetadata,
      llmServices,
      transcriptServices,
      transcriptionModel,
      transcriptionCost
    )

    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    l.dim('\n  processFile command completed successfully.')

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: showNotesResult || '',
      transcript,
      ...showNote
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}