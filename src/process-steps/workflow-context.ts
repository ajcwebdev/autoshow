// src/process-steps/workflow-context.ts

import { generateMarkdown } from './01-generate-markdown.ts'
import { downloadAudio } from './02-download-audio.ts'
import { runTranscription } from './03-run-transcription.ts'
import { selectPrompts } from './04-select-prompt.ts'
import { runLLM } from './05-run-llm.ts'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

/**
 * The state object passed from step to step.
 */
export interface ProcessContext {
  options: ProcessingOptions

  /**
   * An identifier or URL for the “source” being processed.
   */
  source: string

  /**
   * The sanitized file path for writing content in /content,
   * e.g. "content/2025-03-08-some-title"
   */
  finalPath?: string

  /**
   * The front matter metadata string used by the rest of the pipeline.
   */
  frontMatter?: string

  /**
   * The newly created filename without extension, e.g. "2025-03-08-some-title"
   */
  filename?: string

  /**
   * Parsed metadata about the show/file (channel, date, coverImage, etc.)
   */
  metadata?: ShowNoteMetadata

  /**
   * The final transcript from transcription step
   */
  transcript?: string

  /**
   * The cost of transcription
   */
  transcriptionCost?: number

  /**
   * The model ID chosen for transcription
   */
  transcriptionModel?: string

  /**
   * Either a final multi-section prompt or user-provided custom prompt
   */
  selectedPrompts?: string

  /**
   * The final LLM output
   */
  llmOutput?: string
}

/**
 * Create an initial context given user options and a source path or URL.
 */
export function createProcessContext(options: ProcessingOptions, source: string): ProcessContext {
  return { options, source }
}

/**
 * Step 1: Generate Markdown
 */
export async function stepGenerateMarkdown(ctx: ProcessContext) {
  const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(ctx.options, ctx.source)
  ctx.frontMatter = frontMatter
  ctx.finalPath = finalPath
  ctx.filename = filename
  ctx.metadata = metadata
}

/**
 * Step 2: Download Audio
 */
export async function stepDownloadAudio(ctx: ProcessContext) {
  if (!ctx.filename || !ctx.finalPath) {
    throw new Error('Missing filename/finalPath in context before downloading audio.')
  }
  await downloadAudio(ctx.options, ctx.source, ctx.filename)
}

/**
 * Step 3: Run Transcription
 */
export async function stepRunTranscription(ctx: ProcessContext, transcriptServices?: string) {
  if (!ctx.finalPath) {
    throw new Error('Missing finalPath in context for transcription step.')
  }
  const { transcript, transcriptionCost, modelId } = await runTranscription(ctx.options, ctx.finalPath, transcriptServices)
  ctx.transcript = transcript
  ctx.transcriptionCost = transcriptionCost
  ctx.transcriptionModel = modelId
}

/**
 * Step 4: Select Prompts
 */
export async function stepSelectPrompts(ctx: ProcessContext) {
  const chosen = await selectPrompts(ctx.options)
  ctx.selectedPrompts = chosen
}

/**
 * Step 5: Run LLM
 */
export async function stepRunLLM(
  ctx: ProcessContext,
  llmServices?: string,
  transcriptServices?: string
) {
  if (!ctx.finalPath || !ctx.frontMatter || !ctx.metadata) {
    throw new Error('Context missing finalPath/frontMatter/metadata before running LLM.')
  }
  const result = await runLLM(
    ctx.options,
    ctx.finalPath,
    ctx.frontMatter,
    ctx.selectedPrompts || '',
    ctx.transcript || '',
    ctx.metadata,
    llmServices,
    transcriptServices,
    ctx.transcriptionModel,
    ctx.transcriptionCost
  )
  ctx.llmOutput = result || ''
}
