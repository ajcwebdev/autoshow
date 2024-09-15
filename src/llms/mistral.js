// src/llms/mistral.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'

// Define available Mistral AI models
const mistralModel = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

// Main function to call Mistral AI API
export async function callMistral(transcriptContent, outputFilePath, model = 'MISTRAL_NEMO') {
  // Initialize Mistral client with API key from environment variables
  const mistral = new Mistral(env.MISTRAL_API_KEY)
  
  try {
    // Select the actual model to use, defaulting to MISTRAL_NEMO if the specified model is not found
    const actualModel = mistralModel[model] || mistralModel.MISTRAL_NEMO
    
    // Make API call to Mistral AI for chat completion
    const response = await mistral.chat.complete({
      model: actualModel,
      // max_tokens: ?,  // Uncomment and set if you want to limit the response length
      messages: [{ role: 'user', content: transcriptContent }],
    })
    
    // Destructure the response to extract relevant information
    const {
      choices: [{ message: { content }, finishReason }],
      model: usedModel,
      usage: { promptTokens, completionTokens, totalTokens }
    } = response
    
    // Write the generated content to the specified output file
    await writeFile(outputFilePath, content)
    console.log(`Transcript saved to ${outputFilePath}`)
    
    // Log finish reason, used model, and token usage
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${promptTokens} prompt tokens\n  - ${completionTokens} completion tokens\n  - ${totalTokens} total tokens\n`)
    
    // Return the name of the model used
    return Object.keys(mistralModel).find(key => mistralModel[key] === usedModel) || model
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error:', error)
    throw error  // Re-throw the error for handling by the caller
  }
}