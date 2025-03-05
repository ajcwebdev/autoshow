// src/llms/claude.ts

import Anthropic from '@anthropic-ai/sdk'
import { err, logLLMCost } from '../utils/logging'
import { env } from '../utils/node-utils'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Type union of all possible `.modelId` fields for Claude models in {@link LLM_SERVICES_CONFIG}.
 */
type ClaudeModelValue = (typeof LLM_SERVICES_CONFIG.claude.models)[number]['modelId']

/**
 * Calls the Anthropic Claude API and returns generated text.
 *
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param modelValue - The string key identifying which Claude model to use (e.g. "claude-3-haiku-20240307").
 * @returns The generated text from Claude.
 * @throws If the `ANTHROPIC_API_KEY` is missing or no valid content is generated.
 */
export async function callClaude(
  prompt: string,
  transcript: string,
  modelValue: ClaudeModelValue
): Promise<string> {
  if (!env['ANTHROPIC_API_KEY']) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable.')
  }

  const anthropic = new Anthropic({ apiKey: env['ANTHROPIC_API_KEY'] })
  const combinedPrompt = `${prompt}\n${transcript}`

  try {
    const res = await anthropic.messages.create({
      model: modelValue,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: combinedPrompt }
      ]
    })

    // Anthropic messages can return blocks; we look for the first text block:
    const firstBlock = res.content?.[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('No valid text content generated by Claude.')
    }

    logLLMCost({
      name: modelValue,
      stopReason: res.stop_reason ?? 'unknown',
      tokenUsage: {
        input: res.usage?.input_tokens,
        output: res.usage?.output_tokens,
        total: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0)
      }
    })

    return firstBlock.text
  } catch (error) {
    err(`Error in callClaude: ${(error as Error).message}`)
    throw error
  }
}