// src/process-steps/05-run-llm.ts

import { dbService } from '../db.ts'
import { retryLLMCall, logLLMCost } from './05-run-llm-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { writeFile, env } from '../utils/node-utils.ts'
import { validateLLMService } from '../utils/service-config.ts'
import { callChatGPT } from '../llms/chatgpt.ts'
import { callClaude } from '../llms/claude.ts'
import { callGemini } from '../llms/gemini.ts'
import { callDeepSeek } from '../llms/deepseek.ts'
import { callFireworks } from '../llms/fireworks.ts'
import { callTogether } from '../llms/together.ts'
import type { ProcessingOptions, ShowNoteMetadata, LLMResult } from '../../shared/types.ts'

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
  
  // Apply wallet address and mnemonic from options if provided
  metadata.walletAddress = options['walletAddress'] || metadata.walletAddress
  metadata.mnemonic = options['mnemonic'] || metadata.mnemonic
  
  try {
    let showNotesResult = ''
    let llmCost = 0
    let modelId = ''
    
    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      
      // Validate the LLM service and model
      const { service, modelId: validatedModelId, isValid } = validateLLMService(options, llmServices)
      
      if (!isValid || !service) {
        throw new Error(`Invalid LLM service configuration: ${llmServices}`)
      }
      
      // If skipping LLM, exit early
      if (service === null) {
        l.dim('  LLM processing skipped as requested')
        const noLLMFile = `${finalPath}-prompt.md`
        l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
        await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
        return ''
      }
      
      modelId = validatedModelId!
      
      // Execute the appropriate LLM service
      let showNotesData: LLMResult
      
      switch (service) {
        case 'chatgpt':
          showNotesData = await retryLLMCall(
            () => callChatGPT(prompt, transcript, modelId)
          )
          break
        case 'claude':
          showNotesData = await retryLLMCall(
            () => callClaude(prompt, transcript, modelId)
          )
          break
        case 'gemini':
          showNotesData = await retryLLMCall(
            () => callGemini(prompt, transcript, modelId)
          )
          break
        case 'deepseek':
          showNotesData = await retryLLMCall(
            () => callDeepSeek(prompt, transcript, modelId)
          )
          break
        case 'fireworks':
          showNotesData = await retryLLMCall(
            () => callFireworks(prompt, transcript, modelId)
          )
          break
        case 'together':
          showNotesData = await retryLLMCall(
            () => callTogether(prompt, transcript, modelId)
          )
          break
        default:
          throw new Error(`Unknown LLM service: ${service}`)
      }
      
      // Log cost information
      const costBreakdown = logLLMCost({
        serviceName: service,
        modelId,
        stopReason: showNotesData.usage?.stopReason ?? 'unknown',
        tokenUsage: {
          input: showNotesData.usage?.input,
          output: showNotesData.usage?.output,
          total: showNotesData.usage?.total
        }
      })
      
      llmCost = costBreakdown.totalCost ?? 0
      const showNotes = showNotesData.content
      
      // Write output to file
      const outputFilename = `${finalPath}-${service}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.dim(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      
      showNotesResult = showNotes
    } else {
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }
    
    // Calculate final cost
    const finalCost = (transcriptionCost || 0) + llmCost
    
    // Save to database if in server mode
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
        llmModel: modelId,
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