// src/llms/octo.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OctoAIClient } from '@octoai/sdk'

// Define available OctoAI models
const octoModel = {
  LLAMA_3_1_8B: "meta-llama-3.1-8b-instruct",
  LLAMA_3_1_70B: "meta-llama-3.1-70b-instruct",
  LLAMA_3_1_405B: "meta-llama-3.1-405b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  NOUS_HERMES_MIXTRAL_8X_7B: "nous-hermes-2-mixtral-8x7b-dpo",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

// Main function to call OctoAI API
export async function callOcto(transcriptContent, outputFilePath, model = 'LLAMA_3_1_70B') {
  // Initialize OctoAI client with API key from environment variables
  const octoai = new OctoAIClient({ apiKey: env.OCTOAI_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to LLAMA_3_1_70B if the specified model is not found
    const actualModel = octoModel[model] || octoModel.LLAMA_3_1_70B
    
    // Make API call to OctoAI for text generation
    const response = await octoai.textGen.createChatCompletion({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: "user", content: transcriptContent }]
    })
    
    // Destructure the response to extract relevant information
    const {
      choices: [{ message: { content }, finishReason }],
      model: usedModel,
      usage: { promptTokens, completionTokens, totalTokens }
    } = response
    
    // Write the generated content to the specified output file
    await writeFile(outputFilePath, content)
    console.log(`Octo show notes saved to ${outputFilePath}`)
    
    // Log finish reason, used model, and token usage
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${promptTokens} prompt tokens\n  - ${completionTokens} completion tokens\n  - ${totalTokens} total tokens\n`)
    
    // Return the name of the model used
    return Object.keys(octoModel).find(key => octoModel[key] === usedModel) || model
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error:', error)
    throw error  // Re-throw the error for handling by the caller
  }
}