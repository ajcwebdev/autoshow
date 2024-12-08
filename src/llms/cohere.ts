// src/llms/cohere.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'
import { COHERE_MODELS } from '../types/globals'
import { l, wait, err } from '../utils/logging'
import type { LLMFunction, CohereModelType } from '../types/llm-types'

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
      // max_tokens: ?, // Cohere doesn't seem to have a max_tokens parameter for chat
      message: promptAndTranscript // The input message (prompt and transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      text, // The generated text
      meta, // Metadata including token usage
      finishReason // Reason why the generation stopped
    } = response
    
    // Write the generated text to the output file
    if (text) {
      await writeFile(tempPath, text)
    } else {
      throw new Error('No text content generated from the API')
    }
    
    l(wait(`\n  Finish Reason: ${finishReason}\n  Model: ${actualModel}`))
    
    // Check if token usage information is available
    if (meta && meta.tokens) {
      const { inputTokens, outputTokens } = meta.tokens
      l(wait(`  Token Usage:\n    - ${inputTokens} input tokens\n    - ${outputTokens} output tokens`))
    } else {
      l(wait("  - Token usage information not available"))
    }
    
  } catch (error) {
    err(`Error in callCohere: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}