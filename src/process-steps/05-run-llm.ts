// src/process-steps/05-run-llm.ts

import { dbService } from '../db.ts'
/**
 * Re-add "retryLLMCall" to the import if needed. However, your error says
 * "has no exported member 'retryLLMCall'", so we might not import it from '05-run-llm-utils' at all
 * if we define it there. Alternatively, we can remove the usage here if you want to rely on
 * each LLM function's own retry logic. 
 *
 * If you do want to keep it, ensure "retryLLMCall" is exported from '05-run-llm-utils'.
 */
import { logLLMCost, retryLLMCall } from './05-run-llm-utils.ts'
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
      userModel = (typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== '')
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
          // skip or unknown
          showNotesData = { content: '', usage: { stopReason: '', total: 0 } }
          break
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
      if (showNotes) {
        const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
        await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
        l.dim(`\n  LLM processing completed, wrote to:\n    - ${outputFilename}`)
        showNotesResult = showNotes
      }
    } else {
      // no LLM
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
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
    const e = error instanceof Error ? error : new Error(String(error))
    err(`Error running Language Model: ${e.message}`)
    throw e
  }
}
