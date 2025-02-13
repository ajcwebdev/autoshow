// src/llms/claude.ts

import { env } from 'node:process'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODELS } from '../../shared/constants'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

import type { ClaudeModelType } from '../../shared/constants'

/**
 * Main function to call Claude API and extract text content from the response.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The Claude model to use.
 * @returns {Promise<string>} A Promise that resolves with the generated text.
 * @throws {Error} If an error occurs during the API call or no text content is found.
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

    const firstBlock = response.content[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('No text content generated from the API')
    }

    logLLMCost({
      modelName: actualModel,
      stopReason: response.stop_reason ?? 'unknown',
      tokenUsage: {
        input: response.usage?.input_tokens,
        output: response.usage?.output_tokens,
        total: response.usage?.input_tokens + response.usage?.output_tokens
      }
    })

    return firstBlock.text
  } catch (error) {
    err(`Error in callClaude: ${(error as Error).message}`)
    throw error
  }
}