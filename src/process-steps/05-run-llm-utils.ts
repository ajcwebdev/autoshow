// src/process-steps/05-run-llm-utils.ts

import chalk from 'chalk'
import { runLLM } from './05-run-llm.ts'
import { l, err } from '../utils/logging.ts'
import { readFile } from '../utils/node-utils.ts'
import { getLLMModelConfig, validateLLMService } from '../utils/service-config.ts'
import type { ProcessingOptions, ShowNoteMetadata, LlmServiceKey } from '../../shared/types.ts'

export function formatCost(cost: number | undefined): string {
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

export function logLLMCost(info: {
  serviceName: LlmServiceKey
  modelId: string
  stopReason: string
  tokenUsage: {
    input: number | undefined
    output: number | undefined
    total: number | undefined
  }
}): {
  inputCost?: number
  outputCost?: number
  totalCost?: number
} {
  const { serviceName, modelId, stopReason, tokenUsage } = info
  const { input, output, total } = tokenUsage
  
  // Get model configuration
  const modelConfig = getLLMModelConfig(serviceName, modelId)
  
  const displayName = modelConfig?.modelName ?? modelId
  l.dim(`  - ${stopReason ? `${stopReason} Reason` : 'Status'}: ${stopReason}\n  - Model: ${displayName}`)
  
  // Log token usage
  const tokenLines: string[] = []
  if (input) tokenLines.push(`${input} input tokens`)
  if (output) tokenLines.push(`${output} output tokens`)
  if (total) tokenLines.push(`${total} total tokens`)
  if (tokenLines.length > 0) {
    l.dim(`  - Token Usage:\n    - ${tokenLines.join('\n    - ')}`)
  }
  
  // Calculate costs
  let inputCost: number | undefined
  let outputCost: number | undefined
  let totalCost: number | undefined
  
  if (!modelConfig) {
    console.warn(`Warning: Could not find cost configuration for model: ${modelId}`)
  } else {
    // TypeScript friendly access to properties
    const inputCostPer1MCents = 'inputCostPer1MCents' in modelConfig ? 
      modelConfig.inputCostPer1MCents as number : undefined;
      
    const inputCostPer1M = 'inputCostPer1M' in modelConfig ? 
      modelConfig.inputCostPer1M as number : undefined;
      
    const outputCostPer1MCents = 'outputCostPer1MCents' in modelConfig ? 
      modelConfig.outputCostPer1MCents as number : undefined;
      
    const outputCostPer1M = 'outputCostPer1M' in modelConfig ? 
      modelConfig.outputCostPer1M as number : undefined;
    
    const inCost = typeof inputCostPer1MCents === 'number'
      ? inputCostPer1MCents / 100
      : typeof inputCostPer1M === 'number'
        ? inputCostPer1M
        : 0
    
    const outCost = typeof outputCostPer1MCents === 'number'
      ? outputCostPer1MCents / 100
      : typeof outputCostPer1M === 'number'
        ? outputCostPer1M
        : 0
    
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
  
  // Log cost breakdown
  const costLines: string[] = []
  if (inputCost !== undefined) {
    costLines.push(`Input cost: ${formatCost(inputCost)}`)
  }
  if (outputCost !== undefined) {
    costLines.push(`Output cost: ${formatCost(outputCost)}`)
  }
  if (totalCost !== undefined) {
    costLines.push(`Total cost: ${chalk.bold(formatCost(totalCost))}`)
  }
  if (costLines.length > 0) {
    l.dim(`  - Cost Breakdown:\n    - ${costLines.join('\n    - ')}`)
  }
  
  return { inputCost, outputCost, totalCost }
}

export async function retryLLMCall<T>(
  fn: () => Promise<T>
) {
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

export async function runLLMFromPromptFile(
  filePath: string,
  options: ProcessingOptions,
  llmServices: string,
) {
  try {
    const fileContent = await readFile(filePath, 'utf8')
    const { frontMatter, prompt, transcript, metadata } = parsePromptFile(fileContent)
    const finalPath = filePath.replace(/\.[^.]+$/, '')
    await runLLM(
      options,
      finalPath,
      frontMatter,
      prompt,
      transcript,
      metadata,
      llmServices,
      undefined,
      undefined,
      0
    )
  } catch (error) {
    err(`Error in runLLMFromPromptFile: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Parses a file containing front matter, prompt content, and transcript sections.
 *
 * @param {string} fileContent - The raw text content from the markdown file
 * @returns {{ frontMatter: string, prompt: string, transcript: string, metadata: ShowNoteMetadata }}
 */
function parsePromptFile(fileContent: string) {
  let frontMatter = ''
  let prompt = ''
  let transcript = ''
  let metadata: ShowNoteMetadata = {
    title: '',
    publishDate: ''
  }
  
  const lines = fileContent.split('\n')
  let readingFrontMatter = false
  let frontMatterDone = false
  let readingTranscript = false
  
  for (const line of lines) {
    if (!frontMatterDone && line.trim() === '---') {
      readingFrontMatter = !readingFrontMatter
      frontMatter += `${line}\n`
      if (!readingFrontMatter) {
        frontMatterDone = true
      }
      continue
    }
    
    if (!frontMatterDone && readingFrontMatter) {
      frontMatter += `${line}\n`
      const match = line.match(/^(\w+):\s*"?([^"]+)"?/)
      if (match) {
        const key = match[1]
        const value = match[2]
        if (key === 'showLink') metadata.showLink = value || ''
        if (key === 'channel') metadata.channel = value || ''
        if (key === 'channelURL') metadata.channelURL = value || ''
        if (key === 'title') metadata.title = value || ''
        if (key === 'description') metadata.description = value || ''
        if (key === 'publishDate') metadata.publishDate = value || ''
        if (key === 'coverImage') metadata.coverImage = value || ''
      }
      continue
    }
    
    if (line.trim().toLowerCase().startsWith('## transcript')) {
      readingTranscript = true
      transcript += `${line}\n`
      continue
    }
    
    if (readingTranscript) {
      transcript += `${line}\n`
    } else {
      prompt += `${line}\n`
    }
  }
  
  return { frontMatter, prompt, transcript, metadata }
}

export async function estimateLLMCost(
  options: ProcessingOptions,
  llmService: string
): Promise<number> {
  const filePath = options.llmCost
  if (!filePath) {
    throw new Error('No file path provided to estimate LLM cost.')
  }
  
  l.dim(`\nEstimating LLM cost for '${llmService}' with file: ${filePath}`)
  
  try {
    // Validate the LLM service and model
    const { service, modelId, isValid } = validateLLMService(options, llmService)
    
    if (!isValid || !service) {
      throw new Error(`Invalid LLM service configuration: ${llmService}`)
    }
    
    // Read file content for token estimation
    l.dim('[estimateLLMCost] reading file for cost estimate...')
    const content = await readFile(filePath, 'utf8')
    l.dim('[estimateLLMCost] file content length:', content.length)
    
    // Estimate token count
    const tokenCount = approximateTokens(content)
    l.dim('[estimateLLMCost] approximate token count:', tokenCount)
    
    // Get validated model ID
    if (!modelId) {
      throw new Error(`No valid model selected for ${service}`)
    }
    
    // Log and calculate cost
    const costInfo = logLLMCost({
      serviceName: service,
      modelId,
      stopReason: 'n/a',
      tokenUsage: {
        input: tokenCount,
        output: 4000,
        total: tokenCount + 4000
      }
    })
    
    l.dim('[estimateLLMCost] final cost estimate (totalCost):', costInfo.totalCost)
    return costInfo.totalCost ?? 0
  } catch (error) {
    err(`Error estimating LLM cost: ${(error as Error).message}`)
    throw error
  }
}

function approximateTokens(text: string) {
  const words = text.trim().split(/\s+/)
  return Math.max(1, words.length)
}