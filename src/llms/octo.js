// src/llms/octo.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OctoAIClient } from '@octoai/sdk'

/** @import { LLMFunction, OctoModelType } from '../types.js' */

/**
 * Map of OctoAI model identifiers to their API names
 * @type {Record<OctoModelType, string>}
 */
const octoModel = {
  LLAMA_3_1_8B: "meta-llama-3.1-8b-instruct",
  LLAMA_3_1_70B: "meta-llama-3.1-70b-instruct",
  LLAMA_3_1_405B: "meta-llama-3.1-405b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  NOUS_HERMES_MIXTRAL_8X_7B: "nous-hermes-2-mixtral-8x7b-dpo",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

/** @type {LLMFunction} */
/**
 * Main function to call OctoAI API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {OctoModelType} [model='LLAMA_3_1_70B'] - The OctoAI model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during the API call.
 */
export async function callOcto(promptAndTranscript, tempPath, model = 'LLAMA_3_1_70B') {
  // Check if the OCTOAI_API_KEY environment variable is set
  if (!env.OCTOAI_API_KEY) {
    throw new Error('OCTOAI_API_KEY environment variable is not set. Please set it to your OctoAI API key.')
  }
  // Initialize OctoAI client with API key from environment variables
  const octoai = new OctoAIClient({ apiKey: env.OCTOAI_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to LLAMA_3_1_70B if the specified model is not found
    const actualModel = octoModel[model] || octoModel.LLAMA_3_1_70B
    console.log(`\nUsing OctoAI model: ${actualModel}`)
    
    // Make API call to OctoAI for text generation
    const response = await octoai.textGen.createChatCompletion({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: "user", content: promptAndTranscript }]
    })
    
    // Destructure the response to extract relevant information
    const {
      choices: [{ message: { content }, finishReason }],
      model: usedModel,
      usage: { promptTokens, completionTokens, totalTokens }
    } = response
    
    // Write the generated content to the specified output file
    await writeFile(tempPath, content)
    console.log(`\nOctoAI response saved to ${tempPath}`)
    
    // Log finish reason, used model, and token usage
    console.log(`\nFinish Reason: ${finishReason}\nModel Used: ${usedModel}`)
    console.log(`Token Usage:\n  - ${promptTokens} prompt tokens\n  - ${completionTokens} completion tokens\n  - ${totalTokens} total tokens`)
    
  } catch (error) {
    // Log any errors that occur during the process
    console.error(`Error in callOcto: ${error.message}`)
    throw error  // Re-throw the error for handling by the caller
  }
}