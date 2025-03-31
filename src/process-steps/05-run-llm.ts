// src/process-steps/05-run-llm.ts

/**
 * Handles LLM processing and now takes transcription cost and model so final costs can be stored.
 * Also computes the final cost (llm cost + transcription cost) and stores all new fields in the DB.
 *
 * @param {ProcessingOptions} options - The command-line options
 * @param {string} finalPath - The file path (without extension) used for naming outputs
 * @param {string} frontMatter - The front matter section of the markdown
 * @param {string} prompt - The prompt text to be processed by the LLM
 * @param {string} transcript - The transcribed text
 * @param {ShowNoteMetadata} metadata - Additional metadata for the show note
 * @param {string} [llmServices] - The LLM service to use (e.g., 'chatgpt', 'claude')
 * @param {string} [transcriptionServices] - The transcription service used (e.g., 'whisper', 'deepgram')
 * @param {string} [transcriptionModel] - The model used by the transcription service
 * @param {number} [transcriptionCost] - The cost of the transcription step
 * @returns {Promise<string>} - The show notes result from the LLM
 */

import { dbService } from '../db.ts'
import { retryLLMCall, logLLMCost } from './05-run-llm-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { writeFile, env } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import { callChatGPT } from '../llms/chatgpt.ts'
import { callClaude } from '../llms/claude.ts'
import { callGemini } from '../llms/gemini.ts'
import { callDeepSeek } from '../llms/deepseek.ts'
import { callFireworks } from '../llms/fireworks.ts'
import { callTogether } from '../llms/together.ts'

import type { ProcessingOptions, ShowNoteMetadata, LLMResult } from '../../shared/types.ts'
import type { ChatGPTModelValue } from '../llms/chatgpt.ts'
import type { ClaudeModelValue } from '../llms/claude.ts'
import type { GeminiModelValue } from '../llms/gemini.ts'
import type { DeepSeekModelValue } from '../llms/deepseek.ts'
import type { FireworksModelValue } from '../llms/fireworks.ts'
import type { TogetherModelValue } from '../llms/together.ts'

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
    let userModel = ''

    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)

      const config = LLM_SERVICES_CONFIG[llmServices as keyof typeof LLM_SERVICES_CONFIG]
      if (!config) {
        throw new Error(`Unknown LLM service: ${llmServices}`)
      }

      const optionValue = options[llmServices as keyof typeof options]
      const defaultModelId = config.models[0]?.modelId ?? ''
      const userModel = (typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== '')
        ? optionValue
        : defaultModelId

      let showNotesData: LLMResult

      switch (llmServices) {
        case 'chatgpt':
          showNotesData = await retryLLMCall(
            () => callChatGPT(prompt, transcript, userModel as ChatGPTModelValue)
          )
          break

        case 'claude':
          showNotesData = await retryLLMCall(
            () => callClaude(prompt, transcript, userModel as ClaudeModelValue)
          )
          break

        case 'gemini':
          showNotesData = await retryLLMCall(
            () => callGemini(prompt, transcript, userModel as GeminiModelValue)
          )
          break

        case 'deepseek':
          showNotesData = await retryLLMCall(
            () => callDeepSeek(prompt, transcript, userModel as DeepSeekModelValue)
          )
          break

        case 'fireworks':
          showNotesData = await retryLLMCall(
            () => callFireworks(prompt, transcript, userModel as FireworksModelValue)
          )
          break

        case 'together':
          showNotesData = await retryLLMCall(
            () => callTogether(prompt, transcript, userModel as TogetherModelValue)
          )
          break

        default:
          throw new Error(`Unknown LLM service: ${llmServices}`)
      }

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