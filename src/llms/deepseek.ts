// src/llms/deepseek.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { err, logLLMCost } from '../utils/logging'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Type union of all possible `.value` fields for DeepSeek models in {@link LLM_SERVICES_CONFIG}.
 */
type DeepSeekModelValue = (typeof LLM_SERVICES_CONFIG.deepseek.models)[number]['value']

/**
 * Calls the DeepSeek API via an OpenAI-compatible endpoint and returns generated text.
 *
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param modelValue - The string key identifying which DeepSeek model to use (e.g. "deepseek-chat").
 * @returns The generated text from DeepSeek.
 * @throws If the `DEEPSEEK_API_KEY` is missing or no valid response is returned.
 */
export async function callDeepSeek(
  prompt: string,
  transcript: string,
  modelValue: DeepSeekModelValue
): Promise<string> {
  if (!env['DEEPSEEK_API_KEY']) {
    throw new Error('Missing DEEPSEEK_API_KEY environment variable.')
  }

  const openai = new OpenAI({
    apiKey: env['DEEPSEEK_API_KEY'],
    baseURL: 'https://api.deepseek.com'
  })

  const combinedPrompt = `${prompt}\n${transcript}`

  try {
    const res = await openai.chat.completions.create({
      model: modelValue,
      messages: [{ role: 'user', content: combinedPrompt }]
    })

    const firstChoice = res.choices?.[0]
    if (!firstChoice?.message?.content) {
      throw new Error('No valid response from DeepSeek.')
    }

    const content = firstChoice.message.content

    logLLMCost({
      modelName: modelValue,
      stopReason: firstChoice.finish_reason ?? 'unknown',
      tokenUsage: {
        input: res.usage?.prompt_tokens,
        output: res.usage?.completion_tokens,
        total: res.usage?.total_tokens
      }
    })

    return content
  } catch (error) {
    err(`Error in callDeepSeek: ${(error as Error).message}`)
    throw error
  }
}