// src/llms/ollama.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OLLAMA_MODELS } from '../models.js'
import { log, wait } from '../types.js'

/** @import { LLMFunction, OllamaModelType } from '../types.js' */

/**
 * Main function to call the Llama model using the Ollama REST API.
 * This function checks if the model is available, pulls it if necessary,
 * and then proceeds with the chat.
 * @type {LLMFunction}
 * @param {string} promptAndTranscript - The combined prompt and transcript content.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {OllamaModelType} [modelName='LLAMA_3_2_1B'] - The name of the model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during processing.
 */
export async function callOllama(promptAndTranscript, tempPath, modelName = 'LLAMA_3_2_1B') {
  try {
    // Map the model name to the Ollama model identifier
    const ollamaModelName = OLLAMA_MODELS[modelName] || 'llama3.2:1b'
    
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

    const data = await response.json()
    
    // Extract the assistant's reply and write the response to the output file
    const assistantReply = data.message.content
    log(wait(`  - Received response from Ollama.`))
    await writeFile(tempPath, assistantReply)
    log(wait(`\n  Transcript saved to temporary file:\n    - ${tempPath}`))
  } catch (error) {
    console.error(`Error in callOllama: ${error.message}`)
    console.error(`Stack Trace: ${error.stack}`)
    throw error
  }
}