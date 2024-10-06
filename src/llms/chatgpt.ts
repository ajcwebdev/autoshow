// src/llms/chatgpt.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OpenAI } from 'openai'
import { GPT_MODELS } from '../models.js'
import { log, wait } from '../models.js'

import type { LLMFunction, ChatGPTModelType } from '../types.js'

/**
 * Main function to call ChatGPT API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The GPT model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during API call.
 */
export const callChatGPT: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string = 'GPT_4o_MINI'
): Promise<void> => {
  // Check for API key
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please set it to your OpenAI API key.')
  }

  // Initialize the OpenAI client with the API key from environment variables
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to GPT_4o_MINI if not specified
    const actualModel = GPT_MODELS[model as ChatGPTModelType] || GPT_MODELS.GPT_4o_MINI
    
    // Call the OpenAI chat completions API
    const response = await openai.chat.completions.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: promptAndTranscript }], // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      choices: [{ message: { content }, finish_reason }], // The generated content and finish reason
      usage, // Token usage information
      model: usedModel // The actual model used
    } = response
    
    // Write the generated content to the output file
    if (content !== null) {
      await writeFile(tempPath, content)
    } else {
      throw new Error('No content generated from the API')
    }
    
    log(wait(`  - Finish Reason: ${finish_reason}\n  - ChatGPT Model: ${usedModel}`))
    
    // Check if usage information is available
    if (usage) {
      const { prompt_tokens, completion_tokens, total_tokens } = usage
      log(wait(`  - Token Usage:\n    - ${prompt_tokens} prompt tokens\n    - ${completion_tokens} completion tokens\n    - ${total_tokens} total tokens`))
    } else {
      log(wait("  - Token usage information not available"))
    }
    
  } catch (error) {
    console.error(`Error in callChatGPT: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}