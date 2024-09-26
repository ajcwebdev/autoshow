// src/llms/mistral.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'

/** @import { LLMFunction, MistralModelType } from '../types.js' */

/**
 * Map of Mistral model identifiers to their API names
 * @type {Record<MistralModelType, string>}
 */
const mistralModel = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

/** @type {LLMFunction} */
/**
 * Main function to call Mistral AI API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {MistralModelType} [model='MISTRAL_NEMO'] - The Mistral model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during the API call.
 */
export async function callMistral(promptAndTranscript, tempPath, model = 'MISTRAL_NEMO') {
  // Check if the MISTRAL_API_KEY environment variable is set
  if (!env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY environment variable is not set.')
  }
  // Initialize Mistral client with API key from environment variables
  const mistral = new Mistral(env.MISTRAL_API_KEY)
  
  try {
    // Select the actual model to use, defaulting to MISTRAL_NEMO if the specified model is not found
    const actualModel = mistralModel[model] || mistralModel.MISTRAL_NEMO
    
    // Make API call to Mistral AI for chat completion
    const response = await mistral.chat.complete({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: 'user', content: promptAndTranscript }],
    })
    
    // Destructure the response to extract relevant information
    const {
      choices: [{ message: { content }, finishReason }],
      model: usedModel,
      usage: { promptTokens, completionTokens, totalTokens }
    } = response
    
    // Write the generated content to the specified output file
    await writeFile(tempPath, content)
    console.log(`\nTranscript saved to:\n  - ${tempPath}`)
    
    // Log finish reason, used model, and token usage
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${promptTokens} prompt tokens\n  - ${completionTokens} completion tokens\n  - ${totalTokens} total tokens\n`)
    
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error:', error)
    throw error  // Re-throw the error for handling by the caller
  }
}