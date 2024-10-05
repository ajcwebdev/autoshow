// src/llms/mistral.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'
import { MISTRAL_MODELS } from '../models.js'
import { log, wait } from '../types.js'

/** @import { LLMFunction, MistralModelType } from '../types.js' */

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
    throw new Error('MISTRAL_API_KEY environment variable is not set. Please set it to your Mistral API key.')
  }
  // Initialize Mistral client with API key from environment variables
  const mistral = new Mistral(env.MISTRAL_API_KEY)
  
  try {
    // Select the actual model to use, defaulting to MISTRAL_NEMO if the specified model is not found
    const actualModel = MISTRAL_MODELS[model] || MISTRAL_MODELS.MISTRAL_NEMO
    log(wait(`\n  Using Mistral model:\n    - ${actualModel}`))
    
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
    // Log finish reason, used model, and token usage
    log(wait(`\n  Finish Reason: ${finishReason}\n  Model Used: ${usedModel}`))
    log(wait(`  Token Usage:\n    - ${promptTokens} prompt tokens\n    - ${completionTokens} completion tokens\n    - ${totalTokens} total tokens`))
    
  } catch (error) {
    // Log any errors that occur during the process
    console.error(`Error in callMistral: ${error.message}`)
    throw error  // Re-throw the error for handling by the caller
  }
}