// src/llms/cohere.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'

/** @import { LLMFunction, CohereModelType } from '../types.js' */

/**
 * Map of Cohere model identifiers to their API names
 * @type {Record<CohereModelType, string>}
 */
const cohereModel = {
  COMMAND_R: "command-r", // Standard Command model
  COMMAND_R_PLUS: "command-r-plus" // Enhanced Command model
}

/** @type {LLMFunction} */
/**
 * Main function to call Cohere API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {CohereModelType} [model='COMMAND_R'] - The Cohere model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during the API call.
 */
export async function callCohere(promptAndTranscript, tempPath, model = 'COMMAND_R') {
  // Check if the COHERE_API_KEY environment variable is set
  if (!env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY environment variable is not set.')
  }
  
  // Initialize the Cohere client with the API key from environment variables
  const cohere = new CohereClient({ token: env.COHERE_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to COMMAND_R if not specified
    const actualModel = cohereModel[model] || cohereModel.COMMAND_R
    
    // Call the Cohere chat API
    const response = await cohere.chat({
      model: actualModel,
      // max_tokens: ?, // Cohere doesn't seem to have a max_tokens parameter for chat
      message: promptAndTranscript // The input message (prompt and transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      text, // The generated text
      meta: { tokens: { inputTokens, outputTokens } }, // Token usage information
      finishReason // Reason why the generation stopped
    } = response
    
    // Write the generated text to the output file
    await writeFile(tempPath, text)
    
    console.log(`\nTranscript saved to:\n  - ${tempPath}`)
    // console.log(`\nCohere response:\n\n${JSON.stringify(response, null, 2)}`) // Commented out detailed response logging
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${actualModel}`)
    console.log(`Token Usage:\n  - ${inputTokens} input tokens\n  - ${outputTokens} output tokens\n`)
    
  } catch (error) {
    console.error('Error:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}