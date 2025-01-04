// src/llms/cohere.ts

import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'
import { COHERE_MODELS } from '../utils/llm-models'
import { err, logAPIResults } from '../utils/logging'
import type { LLMFunction, CohereModelType } from '../types/llms'

/**
 * Main function to call Cohere API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} tempPath - (unused) The temporary file path (no longer used).
 * @param {string} [model] - The Cohere model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callCohere: LLMFunction = async (
  prompt: string,
  transcript: string,
  model: string = 'COMMAND_R'
): Promise<string> => {
  if (!env['COHERE_API_KEY']) {
    throw new Error('COHERE_API_KEY environment variable is not set. Please set it to your Cohere API key.')
  }
  
  const cohere = new CohereClient({ token: env['COHERE_API_KEY'] })
  
  try {
    const actualModel = (COHERE_MODELS[model as CohereModelType] || COHERE_MODELS.COMMAND_R).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await cohere.chat({
      model: actualModel,
      message: combinedPrompt
    })

    const {
      text,
      meta,
      finishReason
    } = response

    const { inputTokens, outputTokens } = meta?.tokens ?? {}

    logAPIResults({
      modelName: actualModel,
      stopReason: finishReason ?? 'unknown',
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined
      }
    })

    return text
  } catch (error) {
    err(`Error in callCohere: ${(error as Error).message}`)
    throw error
  }
}