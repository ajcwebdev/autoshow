// src/llms/chatgpt.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'
import { err, logLLMCost } from '../utils/logging'

/**
 * Main function to call ChatGPT API.
 * @param {string} prompt
 * @param {string} transcript
 * @param {string} modelValue - e.g. "gpt-4o-mini"
 * @returns {Promise<string>}
 */
export async function callChatGPT(
  prompt: string,
  transcript: string,
  modelValue: string
) {
  if (!env['OPENAI_API_KEY']) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  const modelConfig = LLM_SERVICES_CONFIG.chatgpt.models.find(
    (m) => m.value === modelValue
  )
  if (!modelConfig) {
    throw new Error(`Could not find config for ChatGPT model '${modelValue}'`)
  }

  const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })
  const combinedPrompt = `${prompt}\n${transcript}`

  try {
    const response = await openai.chat.completions.create({
      model: modelConfig.modelId,
      max_completion_tokens: 4000,
      messages: [{ role: 'user', content: combinedPrompt }],
    })

    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      throw new Error('No valid response from the API')
    }

    const content = firstChoice.message.content

    logLLMCost({
      modelName: modelConfig.modelId,
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