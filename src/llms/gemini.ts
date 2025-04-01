// src/llms/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import type { LLMResult } from '../../shared/types.ts'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function callGemini(
  prompt: string,
  transcript: string,
  modelId: string
): Promise<LLMResult> {
  if (!env['GEMINI_API_KEY']) {
    throw new Error('Missing GEMINI_API_KEY environment variable.')
  }
  
  const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY'])
  const geminiModel = genAI.getGenerativeModel({ model: modelId })
  const combinedPrompt = `${prompt}\n${transcript}`
  
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(combinedPrompt)
      const response = await result.response
      const text = response.text()
      
      const { usageMetadata } = response
      const {
        promptTokenCount,
        candidatesTokenCount,
        totalTokenCount
      } = usageMetadata ?? {}
      
      return {
        content: text,
        usage: {
          stopReason: 'complete',
          input: promptTokenCount,
          output: candidatesTokenCount,
          total: totalTokenCount
        }
      }
    } catch (error) {
      err(
        `Error in callGemini (attempt ${attempt}/${maxRetries}): ${
          (error as Error).message
        }`
      )
      
      if (attempt === maxRetries) {
        throw error
      }
      
      await delay(2 ** attempt * 1000)
    }
  }
  
  throw new Error('Exhausted all Gemini API call retries without success.')
}