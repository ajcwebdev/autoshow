// src/llms/octo.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OctoAIClient } from '@octoai/sdk'
import { OCTO_MODELS } from '../models.js'
import { log, wait } from '../types.js'

import type { LLMFunction, OctoModelType } from '../types.js'

/**
 * Main function to call OctoAI API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The OctoAI model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} - If an error occurs during the API call.
 */
export const callOcto: LLMFunction = async (promptAndTranscript: string, tempPath: string, model: string = 'LLAMA_3_1_70B') => {
  // Check if the OCTOAI_API_KEY environment variable is set
  if (!env.OCTOAI_API_KEY) {
    throw new Error('OCTOAI_API_KEY environment variable is not set. Please set it to your OctoAI API key.')
  }
  // Initialize OctoAI client with API key from environment variables
  const octoai = new OctoAIClient({ apiKey: env.OCTOAI_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to LLAMA_3_1_70B if the specified model is not found
    const actualModel = OCTO_MODELS[model as OctoModelType] || OCTO_MODELS.LLAMA_3_1_70B
    log(wait(`\n  Using OctoAI model:\n    - ${actualModel}`))
    
    // Make API call to OctoAI for text generation
    const response = await octoai.textGen.createChatCompletion({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: "user", content: promptAndTranscript }]
    })

    const content = response.choices[0].message.content as string
    const finishReason = response.choices[0].finishReason
    const usedModel = response.model
    const { promptTokens, completionTokens, totalTokens } = response.usage ?? {}
    
    // Write the generated content to the specified output file
    await writeFile(tempPath, content)
    log(wait(`\n  OctoAI response saved to ${tempPath}`))
    
    // Log finish reason, used model, and token usage
    log(wait(`\n  Finish Reason: ${finishReason}\n  Model Used: ${usedModel}`))
    log(wait(`  Token Usage:\n    - ${promptTokens} prompt tokens\n    - ${completionTokens} completion tokens\n    - ${totalTokens} total tokens`))
    
  } catch (error) {
    // Log any errors that occur during the process
    console.error(`Error in callOcto: ${(error as Error).message}`)
    throw error  // Re-throw the error for handling by the caller
  }
}