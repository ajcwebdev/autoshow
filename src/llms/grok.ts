// src/llms/grok.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import type { GrokModelType } from '../utils/types/llms'

/**
 * Calls the Grok API to generate a response to a prompt and transcript.
 * Uses the xAI-compatible OpenAI interface with a custom baseURL.
 *
 * @param {string} prompt - The prompt or instructions for Grok
 * @param {string} transcript - The transcript or additional context to process
 * @param {GrokModelType | string | { modelId: string } | boolean} [model='GROK_2_LATEST'] - The Grok model to use (defaults to GROK_2_LATEST).
 *   Note: a boolean may appear if the CLI is used like `--grok` with no model specified. We handle that by defaulting to 'grok-2-latest'.
 * @throws Will throw an error if GROK_API_KEY is not set or if the API call fails
 * @returns {Promise<string>} The generated text from Grok
 */
export async function callGrok(
  prompt: string,
  transcript: string,
  model: GrokModelType | string | { modelId: string } | boolean = 'GROK_2_LATEST'
): Promise<string> {
  if (!env['GROK_API_KEY']) {
    throw new Error('GROK_API_KEY environment variable is not set. Please set it to your xAI Grok API key.')
  }

  // Safely parse the model parameter, since it can be a string, object, or boolean
  const modelId = typeof model === 'boolean'
    ? 'grok-2-latest'
    : typeof model === 'object'
      ? model?.modelId ?? 'grok-2-latest'
      : typeof model === 'string'
        ? model
        : 'grok-2-latest'

  const openai = new OpenAI({
    apiKey: env['GROK_API_KEY'],
    baseURL: 'https://api.x.ai/v1',
  })

  try {
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: combinedPrompt
        }
      ],
    })

    const firstChoice = response.choices[0]
    if (!firstChoice || !firstChoice.message?.content) {
      throw new Error('No valid response received from Grok API')
    }

    const content = firstChoice.message.content

    if (response.usage) {
      logLLMCost({
        modelName: modelId,
        stopReason: firstChoice.finish_reason ?? 'unknown',
        tokenUsage: {
          input: response.usage.prompt_tokens,
          output: response.usage.completion_tokens,
          total: response.usage.total_tokens
        }
      })
    }

    return content
  } catch (error) {
    err(`Error in callGrok: ${(error as Error).message}`)
    throw error
  }
}