// src/llms/deepseek.ts

import { OpenAI } from 'openai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import { checkLLMApiKey, buildCombinedPrompt } from '../utils/llm-service-utils.ts'

export type DeepSeekModelValue = (typeof LLM_SERVICES_CONFIG.deepseek.models)[number]['modelId']

export async function callDeepSeek(
  prompt: string,
  transcript: string,
  modelValue: DeepSeekModelValue
) {
  // Previously: if (!env['DEEPSEEK_API_KEY']) { ... } throw ...
  checkLLMApiKey('deepseek')

  const openai = new OpenAI({
    apiKey: env['DEEPSEEK_API_KEY'],
    baseURL: 'https://api.deepseek.com'
  })
  const combinedPrompt = buildCombinedPrompt(prompt, transcript)

  try {
    const res = await openai.chat.completions.create({
      model: modelValue,
      messages: [{ role: 'user', content: combinedPrompt }]
    })
    const firstChoice = res.choices?.[0]
    if (!firstChoice?.message?.content) {
      throw new Error('No valid response from DeepSeek.')
    }
    return {
      content: firstChoice.message.content,
      usage: {
        stopReason: firstChoice.finish_reason ?? 'unknown',
        input: res.usage?.prompt_tokens,
        output: res.usage?.completion_tokens,
        total: res.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`Error in callDeepSeek: ${(error as Error).message}`)
    throw error
  }
}
