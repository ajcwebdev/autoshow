// src/llms/chatgpt.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OpenAI } from 'openai'

// Define available GPT models
const gptModel = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

/**
 * Main function to call ChatGPT API.
 * @param {string} transcriptContent - The transcript content to process.
 * @param {string} outputFilePath - The file path to save the output.
 * @param {string} [model='GPT_4o_MINI'] - The GPT model to use.
 * @returns {Promise<string>} - The actual model name used.
 */
export async function callChatGPT(transcriptContent, outputFilePath, model = 'GPT_4o_MINI') {
  // Initialize the OpenAI client with the API key from environment variables
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to GPT_4o_MINI if not specified
    const actualModel = gptModel[model] || gptModel.GPT_4o_MINI
    
    // Call the OpenAI chat completions API
    const response = await openai.chat.completions.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: transcriptContent }], // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      choices: [{ message: { content }, finish_reason }], // The generated content and finish reason
      usage: { prompt_tokens, completion_tokens, total_tokens }, // Token usage information
      model: usedModel // The actual model used
    } = response
    
    // Write the generated content to the output file
    await writeFile(outputFilePath, content)
    
    console.log(`\nTranscript saved to:\n  - ${outputFilePath}`)
    // console.log(`\nChatGPT response:\n\n${JSON.stringify(response, null, 2)}`) // Commented out detailed response logging
    console.log(`\nFinish Reason: ${finish_reason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${prompt_tokens} prompt tokens\n  - ${completion_tokens} completion tokens\n  - ${total_tokens} total tokens\n`)
    
    // Return the actual model name used
    return Object.keys(gptModel).find(key => gptModel[key] === usedModel) || model
  } catch (error) {
    console.error('Error:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}