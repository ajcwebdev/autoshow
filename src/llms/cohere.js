// src/llms/cohere.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'

// Define available Cohere models
const cohereModel = {
  COMMAND_R: "command-r", // Standard Command model
  COMMAND_R_PLUS: "command-r-plus" // Enhanced Command model
}

/**
 * Main function to call Cohere API.
 * @param {string} transcriptContent - The transcript content to process.
 * @param {string} outputFilePath - The file path to save the output.
 * @param {string} [model='COMMAND_R'] - The Cohere model to use.
 * @returns {Promise<string>} - The actual model name used.
 */
export async function callCohere(transcriptContent, outputFilePath, model = 'COMMAND_R') {
  // Initialize the Cohere client with the API key from environment variables
  const cohere = new CohereClient({ token: env.COHERE_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to COMMAND_R if not specified
    const actualModel = cohereModel[model] || cohereModel.COMMAND_R
    
    // Call the Cohere chat API
    const response = await cohere.chat({
      model: actualModel,
      // max_tokens: ?, // Cohere doesn't seem to have a max_tokens parameter for chat
      message: transcriptContent // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      text, // The generated text
      meta: { tokens: { inputTokens, outputTokens } }, // Token usage information
      finishReason // Reason why the generation stopped
    } = response
    
    // Write the generated text to the output file
    await writeFile(outputFilePath, text)
    
    console.log(`\nTranscript saved to:\n  - ${outputFilePath}`)
    // console.log(`\nCohere response:\n\n${JSON.stringify(response, null, 2)}`) // Commented out detailed response logging
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${actualModel}`)
    console.log(`Token Usage:\n  - ${inputTokens} input tokens\n  - ${outputTokens} output tokens\n`)
    
    // Return the actual model name used
    return Object.keys(cohereModel).find(key => cohereModel[key] === actualModel) || model
  } catch (error) {
    console.error('Error:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}