// src/llms/ollama.js

import { writeFile } from 'node:fs/promises'

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

/**
 * Main function to call the Llama model using the Ollama REST API.
 * This function checks if the model is available, pulls it if necessary,
 * and then proceeds with the chat.
 * @type {LLMFunction}
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
    const ollamaHost = process.env.OLLAMA_HOST || 'ollama'
    const ollamaPort = process.env.OLLAMA_PORT || '11434'
    const baseUrl = `http://${ollamaHost}:${ollamaPort}`
    
    console.log(`  - Using Ollama model: ${ollamaModelName} at ${baseUrl}`)
    
    // Call the Ollama chat API
    console.log(`  - Sending chat request to Ollama...`)
    const response = await fetch(`${baseUrl}/api/chat`, {
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

    const data = await response.json()
    
    // Extract the assistant's reply
    const assistantReply = data.message.content
    console.log(`  - Received response from Ollama.`)
    
    // Write the response to the output file
    await writeFile(tempPath, assistantReply)
    console.log(`\nResponse saved to ${tempPath}`)
  } catch (error) {
    console.error(`Error in callOllama: ${error.message}`)
    console.error(`Stack Trace: ${error.stack}`)
    throw error
  }
}