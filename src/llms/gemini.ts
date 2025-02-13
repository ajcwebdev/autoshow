// src/llms/gemini.ts

import { env } from 'node:process'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODELS } from '../../shared/constants'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

import type { GeminiModelType } from '../../shared/constants'

/**
 * Utility function to introduce a delay
 * @param ms - Milliseconds to delay
 * @returns A Promise that resolves after the specified delay
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Main function to call Gemini API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The Gemini model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callGemini = async (
  prompt: string,
  transcript: string,
  model: string = 'GEMINI_1_5_FLASH'
) => {
  if (!env['GEMINI_API_KEY']) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it to your Gemini API key.')
  }
  
  const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY'])
  const actualModel = (GEMINI_MODELS[model as GeminiModelType] || GEMINI_MODELS.GEMINI_1_5_FLASH).modelId
  const geminiModel = genAI.getGenerativeModel({ model: actualModel })

  const maxRetries = 3
  const combinedPrompt = `${prompt}\n${transcript}`

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(combinedPrompt)
      const response = await result.response
      const text = response.text()

      const { usageMetadata } = response
      const { promptTokenCount, candidatesTokenCount, totalTokenCount } = usageMetadata ?? {}

      logLLMCost({
        modelName: actualModel,
        stopReason: 'complete',
        tokenUsage: {
          input: promptTokenCount,
          output: candidatesTokenCount,
          total: totalTokenCount
        }
      })
      
      return text
    } catch (error) {
      err(`Error in callGemini (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? (error as Error).message : String(error)}`)

      if (attempt === maxRetries) {
        throw error
      }

      await delay(Math.pow(2, attempt) * 1000)
    }
  }

  // In case something unexpected happens
  throw new Error('All attempts to call Gemini API have failed.')
}