// src/llms/groq.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { GROQ_MODELS } from '../types/globals'
import { l, err } from '../utils/logging'
import type { GroqChatCompletionResponse, GroqModelType } from '../types/llm-types'

// Define the Groq API URL
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Function to call the Groq chat completion API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {string} model - The model to use, e.g., 'MIXTRAL_8X7B_32768'.
 */
export const callGroq = async (promptAndTranscript: string, tempPath: string, model: string = 'MIXTRAL_8X7B_32768'): Promise<void> => {
  // Ensure that the API key is set
  if (!env['GROQ_API_KEY']) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please set it to your Groq API key.')
  }

  try {
    const actualModel = (GROQ_MODELS[model as GroqModelType] || GROQ_MODELS.MIXTRAL_8X7B_32768).modelId

    // Prepare the request body
    const requestBody = {
      model: actualModel,
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
    const data = (await response.json()) as GroqChatCompletionResponse

    // Extract the generated content
    const content = data.choices[0]?.message?.content
    const finishReason = data.choices[0]?.finish_reason
    const usedModel = data.model
    const usage = data.usage
    const { prompt_tokens, completion_tokens, total_tokens } = usage ?? {}

    if (!content) {
      throw new Error('No content generated from the Groq API')
    }

    // Write the generated content to the specified output file
    await writeFile(tempPath, content)

    // Log finish reason, used model, and token usage
    l.wait(`\n  Finish Reason: ${finishReason}\n  Model Used: ${usedModel}`)
    l.wait(`  Token Usage:\n    - ${prompt_tokens} prompt tokens\n    - ${completion_tokens} completion tokens\n    - ${total_tokens} total tokens`)
  } catch (error) {
    // Log any errors that occur during the process
    err(`Error in callGroq: ${(error as Error).message}`)
    throw error // Re-throw the error for handling by the caller
  }
}