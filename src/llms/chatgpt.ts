// src/llms/chatgpt.ts

import { OpenAI } from 'openai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import { checkLLMApiKey, buildCombinedPrompt } from '../utils/llm-service-utils.ts'

export type ChatGPTModelValue = (typeof LLM_SERVICES_CONFIG.chatgpt.models)[number]['modelId']

export async function callChatGPT(
  prompt: string,
  transcript: string,
  modelValue: ChatGPTModelValue
) {
  // Unified environment check
  checkLLMApiKey('chatgpt')

  const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })
  const combinedPrompt = buildCombinedPrompt(prompt, transcript)

  try {
    const response = await openai.chat.completions.create({
      model: modelValue,
      max_completion_tokens: 4000,
      messages: [{ role: 'user', content: combinedPrompt }],
    })
    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      throw new Error('No valid response from the API')
    }
    const content = firstChoice.message.content
    return {
      content,
      usage: {
        stopReason: firstChoice.finish_reason ?? 'unknown',
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`Error in callChatGPT: ${(error as Error).message}`)
    throw error
  }
}
