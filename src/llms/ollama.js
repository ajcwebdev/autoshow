// src/llms/ollama.js

import { writeFile } from 'node:fs/promises'
import { Ollama } from 'ollama'

/** @import { LLMFunction, LlamaModelType } from '../types.js' */

/**
 * Map of model identifiers to their corresponding names in Ollama
 * @type {Record<LlamaModelType, string>}
 */
const ollamaModels = {
  LLAMA_3_2_1B_MODEL: 'llama3.2:1b',
  LLAMA_3_2_3B_MODEL: 'llama3.2:3b',
  LLAMA_3_1_8B_MODEL: 'llama3.1:8b',
  GEMMA_2_2B_MODEL: 'gemma2:2b',
  GEMMA_2_9B_MODEL: 'gemma2:9b',
  PHI_3_5_MODEL: 'phi3.5:3.8b',
  QWEN_2_5_1B_MODEL: 'qwen2.5:1.5b',
  QWEN_2_5_3B_MODEL: 'qwen2.5:3b',
  QWEN_2_5_7B_MODEL: 'qwen2.5:7b',
}

/** @type {LLMFunction} */
/**
 * Main function to call the Llama model using the Ollama library.
 * This function checks if the model is available, pulls it if necessary,
 * and then proceeds with the chat.
 * @param {string} promptAndTranscript - The combined prompt and transcript content.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {LlamaModelType} [modelName='LLAMA_3_2_1B_MODEL'] - The name of the model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during processing.
 */
export async function callOllama(promptAndTranscript, tempPath, modelName = 'LLAMA_3_2_1B_MODEL') {
  try {
    // Map the model name to the Ollama model identifier
    const ollamaModelName = ollamaModels[modelName] || 'llama3.2:1b'
    
    // Get host and port from environment variables or use defaults
    const ollamaHost = process.env.OLLAMA_HOST || 'localhost'
    const ollamaPort = process.env.OLLAMA_PORT || '11434'
    const baseUrl = `http://${ollamaHost}:${ollamaPort}`

    // Create a new OllamaClient with the baseUrl
    const client = new Ollama({ baseUrl })
    console.log(`  - Using Ollama model: ${ollamaModelName} at ${baseUrl}`)

    // Check if the model is available
    const models = await client.list()
    const isAvailable = models.models.some(model => model.name === ollamaModelName)

    // If the model is not available, pull it
    if (!isAvailable) {
      console.log(`Model ${ollamaModelName} not found. Pulling it now...`)
      try {
        const pullStream = await client.pull({ model: ollamaModelName, stream: true })
        for await (const part of pullStream) {
          console.log(`Pulling ${ollamaModelName}: ${part.status}`)
        }
        console.log(`Model ${ollamaModelName} successfully pulled.`)
      } catch (pullError) {
        console.error(`Error pulling model ${ollamaModelName}: ${pullError.message}`)
        throw pullError
      }
    }

    // Call the Ollama chat API
    const response = await client.chat({
      model: ollamaModelName,
      messages: [{ role: 'user', content: promptAndTranscript }],
    })

    // Extract the assistant's reply
    const assistantReply = response.message.content

    // Write the response to the output file
    await writeFile(tempPath, assistantReply)
    console.log(`\nResponse saved to ${tempPath}`)
  } catch (error) {
    console.error(`Error in callOllama: ${error.message}`)
    throw error
  }
}