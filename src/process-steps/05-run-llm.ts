// src/process-steps/05-run-llm.ts

import { dbService } from '../db.ts'
import chalk from 'chalk'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { writeFile, env, readFile } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import { callChatGPT, callClaude, callGemini, callDeepSeek, callFireworks, callTogether } from '../llms/llm-services.ts'
import type { ChatGPTModelValue, ClaudeModelValue, GeminiModelValue, DeepSeekModelValue, FireworksModelValue, TogetherModelValue } from '../llms/llm-services.ts'
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
          showNotesData = await retryLLMCall(() => callChatGPT(prompt, transcript, userModel as ChatGPTModelValue))
          break
        case 'claude':
          showNotesData = await retryLLMCall(() => callClaude(prompt, transcript, userModel as ClaudeModelValue))
          break
        case 'gemini':
          showNotesData = await retryLLMCall(() => callGemini(prompt, transcript, userModel as GeminiModelValue))
          break
        case 'deepseek':
          showNotesData = await retryLLMCall(() => callDeepSeek(prompt, transcript, userModel as DeepSeekModelValue))
          break
        case 'fireworks':
          showNotesData = await retryLLMCall(() => callFireworks(prompt, transcript, userModel as FireworksModelValue))
          break
        case 'together':
          showNotesData = await retryLLMCall(() => callTogether(prompt, transcript, userModel as TogetherModelValue))
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

export function logLLMCost(info: {
  name: string
  stopReason: string
  tokenUsage: {
    input: number | undefined
    output: number | undefined
    total: number | undefined
  }
}) {
  const { name, stopReason, tokenUsage } = info
  const { input, output, total } = tokenUsage
  let modelConfig: {
    modelId: string
    modelName: string
    inputCostD?: number
    outputCostD?: number
    inputCostC?: number
    outputCostC?: number
  } | undefined
  for (const service of Object.values(LLM_SERVICES_CONFIG)) {
    for (const model of service.models) {
      if (
        model.modelId === name ||
        model.modelId.toLowerCase() === name.toLowerCase()
      ) {
        modelConfig = model
        break
      }
    }
    if (modelConfig) break
  }
  const {
    modelName,
    inputCostD,
    outputCostD,
    inputCostC,
    outputCostC
  } = modelConfig ?? {}
  const displayName = modelName ?? name
  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)
  const tokenLines: string[] = []
  if (input) tokenLines.push(`${input} input tokens`)
  if (output) tokenLines.push(`${output} output tokens`)
  if (total) tokenLines.push(`${total} total tokens`)
  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }
  let inputCost
  let outputCost
  let totalCost
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelName}`)
  } else {
    const inCost = (typeof inputCostC === 'number') ? inputCostC / 100 : (inputCostD || 0)
    const outCost = (typeof outputCostC === 'number') ? outputCostC / 100 : (outputCostD || 0)
    if (inCost < 0.0000001 && outCost < 0.0000001) {
      inputCost = 0
      outputCost = 0
      totalCost = 0
    } else {
      if (input) {
        const rawInputCost = (input / 1_000_000) * inCost
        inputCost = Math.abs(rawInputCost) < 0.00001 ? 0 : rawInputCost
      }
      if (output) {
        const rawOutputCost = (output / 1_000_000) * outCost
        outputCost = Math.abs(rawOutputCost) < 0.00001 ? 0 : rawOutputCost
      }
      if (inputCost !== undefined && outputCost !== undefined) {
        totalCost = inputCost + outputCost
      }
    }
  }
  const costLines: string[] = []
  function inlineCostLabel(cost: number | undefined) {
    if (cost === undefined) return 'N/A'
    if (cost === 0) return '0¢'
    const costInCents = cost * 100
    if (costInCents < 1) {
      return `¢${costInCents.toFixed(4)}`
    }
    if (cost < 1) {
      return `¢${costInCents.toFixed(2)}`
    }
    return `$${cost.toFixed(2)}`
  }
  if (inputCost !== undefined) {
    costLines.push(`Input cost: ${inlineCostLabel(inputCost)}`)
  }
  if (outputCost !== undefined) {
    costLines.push(`Output cost: ${inlineCostLabel(outputCost)}`)
  }
  if (totalCost !== undefined) {
    costLines.push(`Total cost: ${chalk.bold(inlineCostLabel(totalCost))}`)
  }
  if (costLines.length > 0) {
    l.dim(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }
  return { inputCost, outputCost, totalCost }
}

export async function retryLLMCall(fn: () => Promise<any>) {
  const maxRetries = 7
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      attempt++
      l.dim(`  Attempt ${attempt} - Processing LLM call...\n`)
      const result = await fn()
      l.dim(`\n  LLM call completed successfully on attempt ${attempt}.`)
      return result
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting LLM processing.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('LLM call failed after maximum retries.')
}

export async function estimateLLMCost(
  options: ProcessingOptions,
  llmService: string
) {
  const filePath = options.llmCost
  if (!filePath) {
    throw new Error('No file path provided to estimate LLM cost.')
  }
  l.dim(`\nEstimating LLM cost for '${llmService}' with file: ${filePath}`)
  try {
    l.dim('[estimateLLMCost] reading file for cost estimate...')
    const content = await readFile(filePath, 'utf8')
    l.dim('[estimateLLMCost] file content length:', content.length)
    const tokenCount = Math.max(1, content.trim().split(/\s+/).length)
    l.dim('[estimateLLMCost] approximate token count:', tokenCount)
    let userModel = typeof options[llmService] === 'string'
      ? options[llmService] as string
      : undefined
    if (llmService === 'chatgpt' && (userModel === undefined || userModel === 'true')) {
      userModel = 'gpt-4o-mini'
    }
    if (llmService === 'claude' && (userModel === undefined || userModel === 'true')) {
      userModel = 'claude-3-5-haiku-latest'
    }
    if (llmService === 'gemini' && (userModel === undefined || userModel === 'true')) {
      userModel = 'gemini-1.5-flash'
    }
    if (llmService === 'deepseek' && (userModel === undefined || userModel === 'true')) {
      userModel = 'deepseek-chat'
    }
    if (llmService === 'together' && (userModel === undefined || userModel === 'true')) {
      userModel = 'meta-llama/Llama-3.2-3B-Instruct-Turbo'
    }
    l.dim('[estimateLLMCost] determined userModel:', userModel)
    const name = userModel || llmService
    const costInfo = logLLMCost({
      name,
      stopReason: 'n/a',
      tokenUsage: {
        input: tokenCount,
        output: 4000,
        total: tokenCount
      }
    })
    l.dim('[estimateLLMCost] final cost estimate (totalCost):', costInfo.totalCost)
    return costInfo.totalCost ?? 0
  } catch (error) {
    err(`Error estimating LLM cost: ${(error as Error).message}`)
    throw error
  }
}