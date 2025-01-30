// src/llms/together.ts

import { env } from 'node:process'
import { TOGETHER_MODELS } from '../utils/step-utils/llm-utils'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import type { TogetherModelType } from '../utils/types/llms'

/**
 * Main function to call Together AI API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string | TogetherModelType} [model] - The Together AI model to use.
 * @returns {Promise<string>} A Promise that resolves with the generated text.
 * @throws {Error} If an error occurs during the API call.
 */
export const callTogether = async (
  prompt: string,
  transcript: string,
  model: string | TogetherModelType = 'LLAMA_3_2_3B'
) => {
  if (!env['TOGETHER_API_KEY']) {
    throw new Error('TOGETHER_API_KEY environment variable is not set. Please set it to your Together AI API key.')
  }

  try {
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_3B'
    const modelConfig = TOGETHER_MODELS[modelKey as TogetherModelType] || TOGETHER_MODELS.LLAMA_3_2_3B
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

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${env['TOGETHER_API_KEY']}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from the Together AI API')
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
    err(`Error in callTogether: ${(error as Error).message}`)
    throw error
  }
}