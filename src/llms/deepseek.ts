// src/llms/deepseek.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'
import { DEEPSEEK_MODELS } from '../../shared/constants'
import type { DeepSeekModelType } from '../utils/types/llms'

/**
 * Main function to call DeepSeek API via an OpenAI-compatible SDK.
 * 
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param model - (optional) The DeepSeek model to use (e.g., 'DEEPSEEK_CHAT' or 'DEEPSEEK_REASONER').
 *                Defaults to 'DEEPSEEK_CHAT'.
 * @returns A Promise that resolves with the generated text from DeepSeek.
 * @throws Will throw an error if the DEEPSEEK_API_KEY environment variable is not set, or if no valid response is returned.
 */
export async function callDeepSeek(
  prompt: string,
  transcript: string,
  model: string = 'DEEPSEEK_CHAT'
): Promise<string> {
  if (!env['DEEPSEEK_API_KEY']) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set. Please set it to your DeepSeek API key.')
  }

  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: env['DEEPSEEK_API_KEY']
  })

  try {
    const actualModel = (DEEPSEEK_MODELS[model as DeepSeekModelType] || DEEPSEEK_MODELS.DEEPSEEK_CHAT).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await openai.chat.completions.create({
      model: actualModel,
      messages: [{ role: 'user', content: combinedPrompt }]
    })

    const firstChoice = response.choices[0]
    if (!firstChoice || !firstChoice.message?.content) {
      throw new Error('No valid response received from the DeepSeek API')
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
    err(`Error in callDeepSeek: ${(error as Error).message}`)
    throw error
  }
}