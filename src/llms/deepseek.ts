// src/llms/deepseek.ts

import { OpenAI } from 'openai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import type { LLMResult } from '../../shared/types.ts'

export async function callDeepSeek(
  prompt: string,
  transcript: string,
  modelId: string
): Promise<LLMResult> {
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
      model: modelId,
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