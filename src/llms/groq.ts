// src/llms/groq.ts

import { env } from 'node:process'
import { GROQ_MODELS } from '../utils/step-utils/llm-utils'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import type { GroqModelType } from '../utils/types/llms'

/**
 * Function to call the Groq chat completion API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string | GroqModelType} [model] - The model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callGroq = async (
  prompt: string,
  transcript: string,
  model: string | GroqModelType = 'LLAMA_3_2_1B_PREVIEW'
) => {
  if (!env['GROQ_API_KEY']) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please set it to your Groq API key.')
  }

  try {
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_1B_PREVIEW'
    const modelConfig = GROQ_MODELS[modelKey as GroqModelType] || GROQ_MODELS.LLAMA_3_2_1B_PREVIEW
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

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env['GROQ_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from the Groq API')
    }

    logLLMCost({
      modelName: modelKey,
      stopReason: data.choices[0]?.finish_reason ?? 'unknown',
      tokenUsage: {
        input: data.usage?.prompt_tokens,
        output: data.usage?.completion_tokens,
        total: data.usage?.total_tokens
      }
    })

    return content
  } catch (error) {
    err(`Error in callGroq: ${(error as Error).message}`)
    throw error
  }
}