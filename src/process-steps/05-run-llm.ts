// src/process-steps/05-run-llm.ts

/**
 * Handles LLM processing and now takes transcription cost and model so final costs can be stored.
 * Also computes the final cost (llm cost + transcription cost) and stores all new fields in the DB.
 */

import { dbService } from '../db'
import { retryLLMCall, LLM_FUNCTIONS, getModelIdOrDefault, logLLMCost } from './05-run-llm-utils'
import { l, err, logInitialFunctionCall } from '../utils/logging'
import { writeFile, env } from '../utils/node-utils'

import type { ProcessingOptions, ShowNoteMetadata, LLMResult } from '../utils/types'

export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: ShowNoteMetadata,
  llmServices?: string,
  transcriptionServices?: string,
  transcriptionModel?: string,
  transcriptionCost?: number
) {
  l.step(`\nStep 5 - Run Language Model\n`)
  logInitialFunctionCall('runLLM', { llmServices, metadata })

  metadata.walletAddress = options['walletAddress'] || metadata.walletAddress
  metadata.mnemonic = options['mnemonic'] || metadata.mnemonic

  try {
    let showNotesResult = ''
    let llmCost = 0

    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const llmFunction = LLM_FUNCTIONS[llmServices as keyof typeof LLM_FUNCTIONS]
      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
      const userModel = getModelIdOrDefault(llmServices, options[llmServices])

      const showNotesData = await retryLLMCall<LLMResult>(
        async () => {
          return llmFunction(prompt, transcript, userModel)
        }
      )

      const costBreakdown = logLLMCost({
        name: userModel,
        stopReason: showNotesData.usage?.stopReason ?? 'unknown',
        tokenUsage: {
          input: showNotesData.usage?.input,
          output: showNotesData.usage?.output,
          total: showNotesData.usage?.total
        }
      })

      llmCost = costBreakdown.totalCost ?? 0
      const showNotes = showNotesData.content

      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.dim(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }

    const finalCost = (transcriptionCost || 0) + llmCost

    if (env['SERVER_MODE'] === 'true') {
      const userModel = llmServices ? getModelIdOrDefault(llmServices, options[llmServices]) : ''
      await dbService.insertShowNote({
        showLink: metadata.showLink ?? '',
        channel: metadata.channel ?? '',
        channelURL: metadata.channelURL ?? '',
        title: metadata.title,
        description: metadata.description ?? '',
        publishDate: metadata.publishDate,
        coverImage: metadata.coverImage ?? '',
        frontmatter: frontMatter,
        prompt,
        transcript,
        llmOutput: showNotesResult,
        walletAddress: metadata.walletAddress ?? '',
        mnemonic: metadata.mnemonic ?? '',
        llmService: llmServices ?? '',
        llmModel: userModel,
        llmCost,
        transcriptionService: transcriptionServices ?? '',
        transcriptionModel: transcriptionModel ?? '',
        transcriptionCost,
        finalCost
      })
    } else {
      l.dim('\n  Skipping database insertion in CLI mode')
    }

    return showNotesResult
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}