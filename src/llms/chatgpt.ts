// src/llms/chatgpt.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OpenAI } from 'openai'
import { GPT_MODELS } from '../utils/globals'
import { l, err } from '../utils/logging'
import type { LLMFunction, ChatGPTModelType } from '../types/llm-types'

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
  if (!env['OPENAI_API_KEY']) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please set it to your OpenAI API key.')
  }

  // Initialize the OpenAI client with the API key from environment variables
  const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })
  
  try {
    // Select the actual model to use, defaulting to GPT_4o_MINI if not specified
    const actualModel = (GPT_MODELS[model as ChatGPTModelType] || GPT_MODELS.GPT_4o_MINI).modelId
    
    // Call the OpenAI chat completions API
    const response = await openai.chat.completions.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: promptAndTranscript }], // The input message (transcript content)
    })

    // Check if we have a valid response
    const firstChoice = response.choices[0]
    if (!firstChoice || !firstChoice.message?.content) {
      throw new Error('No valid response received from the API')
    }

    // Get the content and other details safely
    const content = firstChoice.message.content
    const finish_reason = firstChoice.finish_reason ?? 'unknown'
    const usedModel = response.model
    const usage = response.usage
    const { prompt_tokens, completion_tokens, total_tokens } = usage ?? {}
    
    // Write the generated content to the output file
    await writeFile(tempPath, content)
    
    l.wait(`  - Finish Reason: ${finish_reason}\n  - ChatGPT Model: ${usedModel}`)
    l.wait(`  - Token Usage:\n    - ${prompt_tokens} prompt tokens\n    - ${completion_tokens} completion tokens\n    - ${total_tokens} total tokens`)
  } catch (error) {
    err(`Error in callChatGPT: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}