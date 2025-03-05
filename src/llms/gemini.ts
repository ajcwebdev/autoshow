// src/llms/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { err, logLLMCost } from '../utils/logging'
import { env } from '../utils/node-utils'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Type union of all possible `.modelId` fields for Gemini models in {@link LLM_SERVICES_CONFIG}.
 */
type GeminiModelValue = (typeof LLM_SERVICES_CONFIG.gemini.models)[number]['modelId']

/**
 * Simple utility function to introduce a delay.
 *
 * @param ms - Milliseconds to pause execution
 * @returns A Promise that resolves after the specified delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calls the Google Gemini API and returns generated text.
 *
 * Attempts multiple retries (exponential backoff) to handle transient network errors.
 *
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param modelValue - The string key identifying which Gemini model to use (e.g. "gemini-1.5-flash").
 * @returns The generated text from Gemini.
 * @throws If the `GEMINI_API_KEY` is missing or all API call retries fail.
 */
export async function callGemini(
  prompt: string,
  transcript: string,
  modelValue: GeminiModelValue
): Promise<string> {
  if (!env['GEMINI_API_KEY']) {
    throw new Error('Missing GEMINI_API_KEY environment variable.')
  }

  const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY'])
  const geminiModel = genAI.getGenerativeModel({ model: modelValue })
  const combinedPrompt = `${prompt}\n${transcript}`

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(combinedPrompt)
      const response = await result.response
      const text = response.text()

      // Usage metadata (if provided)
      const { usageMetadata } = response
      const {
        promptTokenCount,
        candidatesTokenCount,
        totalTokenCount
      } = usageMetadata ?? {}

      logLLMCost({
        name: modelValue,
        stopReason: 'complete',
        tokenUsage: {
          input: promptTokenCount,
          output: candidatesTokenCount,
          total: totalTokenCount
        }
      })

      return text
    } catch (error) {
      err(
        `Error in callGemini (attempt ${attempt}/${maxRetries}): ${
          (error as Error).message
        }`
      )

      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff before next retry
      await delay(2 ** attempt * 1000)
    }
  }

  throw new Error('Exhausted all Gemini API call retries without success.')
}