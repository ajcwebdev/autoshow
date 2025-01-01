// src/llms/groq.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { GROQ_MODELS } from '../utils/globals'
import { err, logAPIResults } from '../utils/logging'
import type { LLMFunction, GroqModelType, GroqChatCompletionResponse } from '../types/llms'

// Define the Groq API URL
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Function to call the Groq chat completion API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {string} model - The model to use, e.g., 'LLAMA_3_2_1B_PREVIEW'.
 */
export const callGroq: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string | GroqModelType = 'LLAMA_3_2_1B_PREVIEW'
): Promise<void> => {
  // Ensure that the API key is set
  if (!env['GROQ_API_KEY']) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please set it to your Groq API key.')
  }

  try {
    // Get the model configuration and ID, defaulting to LLAMA_3_2_1B_PREVIEW if not found
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_1B_PREVIEW'
    const modelConfig = GROQ_MODELS[modelKey as GroqModelType] || GROQ_MODELS.LLAMA_3_2_1B_PREVIEW
    const modelId = modelConfig.modelId

    // Prepare the request body
    const requestBody = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: promptAndTranscript,
        },
      ],
      // max_tokens: 4000,
    }

    // Send the POST request
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env['GROQ_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // Parse the JSON response
    const data = await response.json() as GroqChatCompletionResponse

    // Extract the generated content
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from the Groq API')
    }

    // Write the generated content to the specified output file
    await writeFile(tempPath, content)

    // Log API results using the standardized logging function
    logAPIResults({
      modelName: modelKey,
      stopReason: data.choices[0]?.finish_reason ?? 'unknown',
      tokenUsage: {
        input: data.usage?.prompt_tokens,
        output: data.usage?.completion_tokens,
        total: data.usage?.total_tokens
      }
    })
  } catch (error) {
    // Log any errors that occur during the process
    err(`Error in callGroq: ${(error as Error).message}`)
    throw error // Re-throw the error for handling by the caller
  }
}