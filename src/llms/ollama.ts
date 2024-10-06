// src/llms/ollama.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OLLAMA_MODELS } from '../models.js'
import { log, wait } from '../types.js'

import type { LLMFunction, OllamaModelType } from '../types.js'

// Define the expected structure of the response from Ollama API
interface OllamaResponse {
  message: {
    content: string
  }
}

/**
 * Main function to call the Llama model using the Ollama REST API.
 * This function checks if the model is available, pulls it if necessary,
 * and then proceeds with the chat.
 * @param promptAndTranscript - The combined prompt and transcript content.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param modelName - The name of the model to use.
 * @returns A Promise that resolves when the processing is complete.
 * @throws {Error} - If an error occurs during processing.
 */
export const callOllama: LLMFunction = async (promptAndTranscript: string, tempPath: string, modelName: string = 'LLAMA_3_2_1B') => {
  try {
    // Map the model name to the Ollama model identifier
    const ollamaModelName = OLLAMA_MODELS[modelName as OllamaModelType] || 'llama3.2:1b'
    
    // Get host and port from environment variables or use defaults
    const ollamaHost = env.OLLAMA_HOST || 'ollama'
    const ollamaPort = env.OLLAMA_PORT || '11434'
    log(wait(`  - Using Ollama model: ${ollamaModelName} at http://${ollamaHost}:${ollamaPort}`))
    
    // Call the Ollama chat API
    log(wait(`  - Sending chat request to Ollama...`))
    const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModelName,
        messages: [{ role: 'user', content: promptAndTranscript }],
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Type assertion to enforce the structure of the response
    const data = (await response.json()) as OllamaResponse

    // Extract the assistant's reply and write the response to the output file
    const assistantReply = data.message.content
    log(wait(`  - Received response from Ollama.`))
    await writeFile(tempPath, assistantReply)
    log(wait(`\n  Transcript saved to temporary file:\n    - ${tempPath}`))
  } catch (error) {
    console.error(`Error in callOllama: ${error instanceof Error ? (error as Error).message : String(error)}`)
    console.error(`Stack Trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`)
    throw error
  }
}