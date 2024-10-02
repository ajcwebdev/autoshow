// src/llms/ollamaClient.js

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

/**
 * Main function to call the Llama model using the Ollama library.
 * This function initializes the client, checks if the model is available,
 * pulls it if necessary, and then proceeds with the chat.
 * @type {LLMFunction}
 * @param {string} promptAndTranscript - The combined prompt and transcript content.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {LlamaModelType} [modelName='LLAMA_3_2_1B_MODEL'] - The name of the model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during processing.
 */
export async function callOllama(promptAndTranscript, tempPath, modelName = 'LLAMA_3_2_1B_MODEL') {
  const ollamaHost = process.env.OLLAMA_HOST || '127.0.0.1'
  const ollamaPort = process.env.OLLAMA_PORT || 11434
  const baseUrl = `http://${ollamaHost}:${ollamaPort}`
  
  console.log(`Initializing Ollama client with base URL: ${baseUrl}`)
  const ollamaClient = new Ollama({ host: baseUrl })
  
  try {
    // Test connection to Ollama server
    console.log('Testing connection to Ollama server...')
    await ollamaClient.list()
    console.log('Successfully connected to Ollama server.')

    // Map the model name to the Ollama model identifier
    const ollamaModelName = ollamaModels[modelName] || 'llama3.2:1b'
    console.log(`  - ${ollamaModelName} model selected.`)

    // Check if the model is available
    console.log('Checking model availability...')
    const models = await ollamaClient.list()
    const isAvailable = models.models.some(model => model.name === ollamaModelName)

    // If the model is not available, pull it
    if (!isAvailable) {
      console.log(`Model ${ollamaModelName} not found. Pulling it now...`)
      const pullStream = await ollamaClient.pull({ model: ollamaModelName, stream: true })
      for await (const part of pullStream) {
        console.log(`Pulling ${ollamaModelName}: ${part.status}`)
      }
      console.log(`Model ${ollamaModelName} successfully pulled.`)
    } else {
      console.log(`Model ${ollamaModelName} is available.`)
    }

    // Call the Ollama chat API
    console.log('Sending request to Ollama chat API...')
    const response = await ollamaClient.chat({
      model: ollamaModelName,
      messages: [{ role: 'user', content: promptAndTranscript }],
    })

    // Extract the assistant's reply
    const assistantReply = response.message.content

    // Write the response to the output file
    console.log(`Writing response to file: ${tempPath}`)
    await writeFile(tempPath, assistantReply)
  } catch (error) {
    console.error('Error in callOllama:', error)
    if (error.code === 'ECONNREFUSED') {
      console.error(`Failed to connect to Ollama server at ${baseUrl}. Please ensure it's running and accessible.`)
    }
    throw error
  }
}