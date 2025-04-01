// src/llms/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { err } from '../utils/logging.ts'
import { env } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'
import { checkLLMApiKey, buildCombinedPrompt } from '../utils/llm-service-utils.ts'

export type GeminiModelValue = (typeof LLM_SERVICES_CONFIG.gemini.models)[number]['modelId']

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function callGemini(
  prompt: string,
  transcript: string,
  modelValue: GeminiModelValue
) {
  checkLLMApiKey('gemini')

  const apiKey = env['GEMINI_API_KEY']
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({ model: modelValue })
  const combinedPrompt = buildCombinedPrompt(prompt, transcript)

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
      const e = error instanceof Error ? error : new Error(String(error))
      err(`Error in callGemini (attempt ${attempt}/${maxRetries}): ${e.message}`)
      if (attempt === maxRetries) {
        throw e
      }
      await delay(2 ** attempt * 1000)
    }
  }
  throw new Error('Exhausted all Gemini API call retries without success.')
}
