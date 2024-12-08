// src/llms/mistral.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'
import { MISTRAL_MODELS } from '../types/globals'
import { l, wait, err } from '../utils/logging'
import type { LLMFunction, MistralModelType } from '../types/llm-types'

/**
 * Main function to call Mistral AI API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The Mistral model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callMistral: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string = 'MISTRAL_NEMO'
): Promise<void> => {
  // Check if the MISTRAL_API_KEY environment variable is set
  if (!env['MISTRAL_API_KEY']) {
    throw new Error('MISTRAL_API_KEY environment variable is not set. Please set it to your Mistral API key.')
  }

  // Initialize Mistral client with API key from environment variables
  const mistral = new Mistral({ apiKey: env['MISTRAL_API_KEY'] })
  
  try {
    // Select the actual model to use, defaulting to MISTRAL_NEMO if the specified model is not found
    const actualModel = (MISTRAL_MODELS[model as MistralModelType] || MISTRAL_MODELS.MISTRAL_NEMO).modelId
    l(wait(`\n  Using Mistral model:\n    - ${actualModel}`))
    
    // Make API call to Mistral AI for chat completion
    const response = await mistral.chat.complete({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: 'user', content: promptAndTranscript }],
    })

    // Safely access the response properties with proper null checks
    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices returned from Mistral API")
    }

    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      throw new Error("Invalid response format from Mistral API")
    }

    const content = firstChoice.message.content
    const finishReason = firstChoice.finishReason ?? 'unknown'
    const usage = response.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    
    // Write the generated content to the specified output file
    await writeFile(tempPath, content)

    // Log finish reason, used model, and token usage
    l(wait(`\n  Finish Reason: ${finishReason}\n  Model Used: ${actualModel}`))
    l(wait(`  Token Usage:\n    - ${usage.promptTokens} prompt tokens\n    - ${usage.completionTokens} completion tokens\n    - ${usage.totalTokens} total tokens`))
    
  } catch (error) {
    // Log any errors that occur during the process
    err(`Error in callMistral: ${error instanceof Error ? error.message : String(error)}`)
    throw error  // Re-throw the error for handling by the caller
  }
}