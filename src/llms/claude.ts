// src/llms/claude.ts

import { env } from 'node:process'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODELS } from '../../shared/constants'
import { err, logLLMCost } from '../utils/logging'

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
  model: keyof typeof CLAUDE_MODELS = 'CLAUDE_3_HAIKU'
) => {
  if (!env['ANTHROPIC_API_KEY']) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please set it to your Anthropic API key.')
  }

  const anthropic = new Anthropic({ apiKey: env['ANTHROPIC_API_KEY'] })
  
  try {
    const actualModel = CLAUDE_MODELS[model].modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const res = await anthropic.messages.create({
      model: actualModel,
      max_tokens: 4000,
      messages: [{ role: 'user', content: combinedPrompt }]
    })

    const firstBlock = res.content[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('No text content generated from the API')
    }

    logLLMCost({
      modelName: actualModel,
      stopReason: res.stop_reason ?? 'unknown',
      tokenUsage: {
        input: res.usage?.input_tokens,
        output: res.usage?.output_tokens,
        total: res.usage?.input_tokens + res.usage?.output_tokens
      }
    })

    return firstBlock.text
  } catch (error) {
    err(`Error in callClaude: ${(error as Error).message}`)
    throw error
  }
}