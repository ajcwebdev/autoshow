// src/llms/gemini.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODELS } from '../types/globals'
import { l, wait, err } from '../utils/logging'
import type { LLMFunction, GeminiModelType } from '../types/llm-types'

/**
 * Utility function to introduce a delay
 * @param ms - Milliseconds to delay
 * @returns A Promise that resolves after the specified delay
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Main function to call Gemini API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The Gemini model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callGemini: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string = 'GEMINI_1_5_FLASH'
): Promise<void> => {
  // Check if the GEMINI_API_KEY environment variable is set
  if (!env['GEMINI_API_KEY']) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it to your Gemini API key.')
  }
  
  // Initialize the Google Generative AI client
  const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY'])
  
  // Select the actual model to use, defaulting to GEMINI_1_5_FLASH if not specified
  const actualModel = (GEMINI_MODELS[model as GeminiModelType] || GEMINI_MODELS.GEMINI_1_5_FLASH).modelId
  
  // Create a GenerativeModel instance
  const geminiModel = genAI.getGenerativeModel({ model: actualModel })

  const maxRetries = 3 // Maximum number of retry attempts
  
  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate content using the selected model
      const result = await geminiModel.generateContent(promptAndTranscript)
      
      // Get the response from the generated content
      const response = await result.response
      
      // Extract the text from the response
      const text = response.text()
      
      // Check if text was generated
      if (!text) {
        throw new Error("No text generated from Gemini")
      }
      
      // Write the generated text to the output file
      await writeFile(tempPath, text)
      l(wait(`\nModel: ${actualModel}`))
      
      return
    } catch (error) {
      err(`Error in callGemini (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? (error as Error).message : String(error)}`)
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying, with exponential backoff
      await delay(Math.pow(2, attempt) * 1000)
    }
  }
}