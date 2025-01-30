// src/llms/chatgpt.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { GPT_MODELS } from '../utils/step-utils/llm-utils'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import type { ChatGPTModelType } from '../utils/types/llms'

/**
 * Main function to call ChatGPT API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The GPT model to use.
 * @returns {Promise<string>} A Promise that resolves with the generated text.
 * @throws {Error} If an error occurs during API call.
 */
export const callChatGPT = async (
  prompt: string,
  transcript: string,
  model: string = 'GPT_4o_MINI'
) => {
  if (!env['OPENAI_API_KEY']) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please set it to your OpenAI API key.')
  }

  const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })

  try {
    const actualModel = (GPT_MODELS[model as ChatGPTModelType] || GPT_MODELS.GPT_4o_MINI).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await openai.chat.completions.create({
      model: actualModel,
      max_completion_tokens: 4000,
      messages: [{ role: 'user', content: combinedPrompt }],
    })

    const firstChoice = response.choices[0]
    if (!firstChoice || !firstChoice.message?.content) {
      throw new Error('No valid response received from the API')
    }

    const content = firstChoice.message.content

    logLLMCost({
      modelName: actualModel,
      stopReason: firstChoice.finish_reason ?? 'unknown',
      tokenUsage: {
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    })

    return content
  } catch (error) {
    err(`Error in callChatGPT: ${(error as Error).message}`)
    throw error
  }
}