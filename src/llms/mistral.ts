// src/llms/mistral.ts

import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'
import { MISTRAL_MODELS } from '../utils/step-utils/llm-utils'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import type { MistralModelType } from '../utils/types/llms'

/**
 * Main function to call Mistral AI API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The Mistral model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callMistral = async (
  prompt: string,
  transcript: string,
  model: string = 'MISTRAL_NEMO'
) => {
  if (!env['MISTRAL_API_KEY']) {
    throw new Error('MISTRAL_API_KEY environment variable is not set. Please set it to your Mistral API key.')
  }

  const mistral = new Mistral({ apiKey: env['MISTRAL_API_KEY'] })
  
  try {
    const actualModel = (MISTRAL_MODELS[model as MistralModelType] || MISTRAL_MODELS.MISTRAL_NEMO).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await mistral.chat.complete({
      model: actualModel,
      messages: [{ role: 'user', content: combinedPrompt }],
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices returned from Mistral API")
    }

    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      throw new Error("Invalid response format from Mistral API")
    }

    const content = firstChoice.message.content
    const contentString = Array.isArray(content) ? content.join('') : content

    logLLMCost({
      modelName: actualModel,
      stopReason: firstChoice.finishReason ?? 'unknown',
      tokenUsage: {
        input: response.usage?.promptTokens,
        output: response.usage?.completionTokens,
        total: response.usage?.totalTokens
      }
    })
    
    return contentString
  } catch (error) {
    err(`Error in callMistral: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}