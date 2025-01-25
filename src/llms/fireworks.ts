// src/llms/fireworks.ts

import { env } from 'node:process'
import { FIREWORKS_MODELS } from '../utils/globals/llms'
import { err, logLLMCost } from '../utils/logging'
import type { FireworksModelType, FireworksResponse } from '../utils/types/llms'

/**
 * Main function to call Fireworks AI API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string | FireworksModelType} [model] - The Fireworks model to use.
 * @returns {Promise<string>} A Promise that resolves with the generated text.
 * @throws {Error} If an error occurs during the API call.
 */
export const callFireworks = async (
  prompt: string,
  transcript: string,
  model: string | FireworksModelType = 'LLAMA_3_2_3B'
) => {
  if (!env['FIREWORKS_API_KEY']) {
    throw new Error('FIREWORKS_API_KEY environment variable is not set. Please set it to your Fireworks API key.')
  }

  try {
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_3B'
    const modelConfig = FIREWORKS_MODELS[modelKey as FireworksModelType] || FIREWORKS_MODELS.LLAMA_3_2_3B
    const modelId = modelConfig.modelId

    const combinedPrompt = `${prompt}\n${transcript}`
    const requestBody = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: combinedPrompt,
        },
      ],
    }

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env['FIREWORKS_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fireworks API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as FireworksResponse
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content generated from the Fireworks API')
    }

    logLLMCost({
      modelName: modelKey,
      stopReason: data.choices[0]?.finish_reason ?? 'unknown',
      tokenUsage: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens
      }
    })

    return content
  } catch (error) {
    err(`Error in callFireworks: ${(error as Error).message}`)
    throw error
  }
}