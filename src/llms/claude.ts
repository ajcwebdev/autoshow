// src/llms/claude.ts

import { env } from 'node:process'
import { Anthropic } from '@anthropic-ai/sdk'
import { CLAUDE_MODELS } from '../utils/llm-utils'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/llm-utils'
import type { ClaudeModelType } from '../utils/types/llms'

/**
 * Extracts text content from the API response
 * @param content - The content returned by the API
 * @returns The extracted text content, or null if no text content is found
 */
interface ContentBlock {
  type: string;
  text?: string;
}

/**
 * Main function to call Claude API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} tempPath - (unused) The temporary file path (no longer used).
 * @param {string} [model] - The Claude model to use.
 * @returns {Promise<string>} A Promise that resolves with the generated text.
 * @throws {Error} If an error occurs during the API call.
 */
export const callClaude = async (
  prompt: string,
  transcript: string,
  model: string = 'CLAUDE_3_HAIKU'
) => {
  if (!env['ANTHROPIC_API_KEY']) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please set it to your Anthropic API key.')
  }

  const anthropic = new Anthropic({ apiKey: env['ANTHROPIC_API_KEY'] })
  
  try {
    const actualModel = (CLAUDE_MODELS[model as ClaudeModelType] || CLAUDE_MODELS.CLAUDE_3_HAIKU).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await anthropic.messages.create({
      model: actualModel,
      max_tokens: 4000,
      messages: [{ role: 'user', content: combinedPrompt }]
    })

    const textContent = extractTextContent(response.content)

    if (!textContent) {
      throw new Error('No text content generated from the API')
    }

    logLLMCost({
      modelName: actualModel,
      stopReason: response.stop_reason ?? 'unknown',
      tokenUsage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens
      }
    })

    return textContent
  } catch (error) {
    err(`Error in callClaude: ${(error as Error).message}`)
    throw error
  }
}

function extractTextContent(content: ContentBlock[]): string | null {
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      if (block.type === 'text' && 'text' in block) {
        return block.text ?? null;
      }
    }
  }
  return null;
}