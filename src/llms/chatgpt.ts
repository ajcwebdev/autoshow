// src/llms/chatgpt.ts

import { OpenAI } from 'openai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import type { LLMResult } from '../../shared/types.ts'

export async function callChatGPT(
  prompt: string,
  transcript: string,
  modelId: string
): Promise<LLMResult> {
  if (!env['OPENAI_API_KEY']) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  
  const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })
  const combinedPrompt = `${prompt}\n${transcript}`
  
  try {
    const response = await openai.chat.completions.create({
      model: modelId,
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