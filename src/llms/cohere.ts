// src/llms/cohere.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'
import { COHERE_MODELS } from '../utils/llm-models'
import { err, logAPIResults } from '../utils/logging'
import type { LLMFunction, CohereModelType } from '../types/llms'

/**
 * Main function to call Cohere API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The Cohere model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callCohere: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string = 'COMMAND_R'
): Promise<void> => {
  // Check if the COHERE_API_KEY environment variable is set
  if (!env['COHERE_API_KEY']) {
    throw new Error('COHERE_API_KEY environment variable is not set. Please set it to your Cohere API key.')
  }
  
  // Initialize the Cohere client with the API key from environment variables
  const cohere = new CohereClient({ token: env['COHERE_API_KEY'] })
  
  try {
    // Select the actual model to use, defaulting to COMMAND_R if not specified
    const actualModel = (COHERE_MODELS[model as CohereModelType] || COHERE_MODELS.COMMAND_R).modelId
    
    // Call the Cohere chat API
    const response = await cohere.chat({
      model: actualModel,
      message: promptAndTranscript // The input message (prompt and transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      text, // The generated text
      meta, // Metadata including token usage
      finishReason // Reason why the generation stopped
    } = response

    const { inputTokens, outputTokens } = meta?.tokens ?? {}
    
    // Write the generated text to the output file
    await writeFile(tempPath, text)
    
    // Log API results using the standardized logging function
    logAPIResults({
      modelName: actualModel,
      stopReason: finishReason ?? 'unknown',
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined
      }
    })
  } catch (error) {
    err(`Error in callCohere: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}