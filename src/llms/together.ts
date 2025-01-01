// src/llms/together.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { TOGETHER_MODELS } from '../utils/globals'
import { err, logAPIResults } from '../utils/logging'
import type { LLMFunction, TogetherModelType, TogetherResponse } from '../types/llms'

/**
 * Main function to call Together AI API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The Together AI model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} - If an error occurs during the API call.
 */
export const callTogether: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string | TogetherModelType = 'LLAMA_3_2_3B'
): Promise<void> => {
  // Check if the TOGETHER_API_KEY environment variable is set
  if (!env['TOGETHER_API_KEY']) {
    throw new Error('TOGETHER_API_KEY environment variable is not set. Please set it to your Together AI API key.')
  }

  try {
    // Get the model configuration and ID, defaulting to LLAMA_3_2_3B if not found
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_3B'
    const modelConfig = TOGETHER_MODELS[modelKey as TogetherModelType] || TOGETHER_MODELS.LLAMA_3_2_3B
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
      // max_tokens: 2000,
      // temperature: 0.7,
    }

    // Make API call to Together AI
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${env['TOGETHER_API_KEY']}`,
      },
      body: JSON.stringify(requestBody),
    })

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as TogetherResponse

    // Extract the generated content
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from the Together AI API')
    }

    // Write the generated content to the specified output file
    await writeFile(tempPath, content)

    // Log API results using the standardized logging function
    logAPIResults({
      modelName: modelKey,
      stopReason: data.choices[0]?.finish_reason ?? 'unknown',
      tokenUsage: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens
      }
    })
  } catch (error) {
    // Log any errors that occur during the process
    err(`Error in callTogether: ${(error as Error).message}`)
    throw error // Re-throw the error for handling by the caller
  }
}