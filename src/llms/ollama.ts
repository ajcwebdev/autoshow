// src/llms/ollama.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OLLAMA_MODELS } from '../models.js'
import { log, wait } from '../models.js'
import { spawn } from 'child_process'

import type { LLMFunction, OllamaModelType, OllamaResponse, OllamaTagsResponse } from '../types.js'

/**
 * Main function to call the Llama model using the Ollama REST API.
 * This function ensures the Ollama server is running, checks if the model is available,
 * and then proceeds with the chat using a streaming response.
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
    log(wait(`    - modelName: ${modelName}\n    - ollamaModelName: ${ollamaModelName}`))
    
    // Get host and port from environment variables or use defaults
    const ollamaHost = env.OLLAMA_HOST || 'localhost'
    const ollamaPort = env.OLLAMA_PORT || '11434'
    
    // Check if Ollama server is running, start if not
    async function checkServer(): Promise<boolean> {
      try {
        const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
        return serverResponse.ok
      } catch (error) {
        return false
      }
    }

    if (await checkServer()) {
      log(wait('    - Ollama server is already running.'))
    } else {
      log(wait('    - Ollama server is not running. Attempting to start...'))
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      })
      ollamaProcess.unref()

      // Wait for the server to be ready
      let attempts = 0
      while (attempts < 30) {  // Increased to 30 attempts, 30 seconds total
        if (await checkServer()) {
          log(wait('    - Ollama server is now ready.'))
          break
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }
      if (attempts === 30) {
        throw new Error('Ollama server failed to become ready in time.')
      }
    }
    
    // Check if the model is available, pull if not
    try {
      const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
      if (!tagsResponse.ok) {
        throw new Error(`HTTP error! status: ${tagsResponse.status}`)
      }
      const tagsData = await tagsResponse.json() as OllamaTagsResponse
      const isModelAvailable = tagsData.models.some(model => model.name === ollamaModelName)
      if (!isModelAvailable) {
        log(wait(`\n  Model ${ollamaModelName} is not available, pulling the model...`))
        const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: ollamaModelName }),
        })
        if (!pullResponse.ok) {
          throw new Error(`Failed to initiate pull for model ${ollamaModelName}`)
        }
        if (!pullResponse.body) {
          throw new Error('Response body is null')
        }
        const reader = pullResponse.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.trim() === '') continue
            try {
              const response = JSON.parse(line)
              if (response.status === 'success') {
                log(wait(`    - Model ${ollamaModelName} has been pulled successfully.`))
                break
              }
            } catch (parseError) {
              console.error(`Error parsing JSON: ${parseError}`)
            }
          }
        }
      } else {
        log(wait(`\n  Model ${ollamaModelName} is already available...`))
      }
    } catch (error) {
      console.error(`Error checking/pulling model: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
    
    log(wait(`    - Sending chat request to http://${ollamaHost}:${ollamaPort} using ${ollamaModelName} model`))
    
    // Call the Ollama chat API with streaming enabled
    const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModelName,
        messages: [{ role: 'user', content: promptAndTranscript }],
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let isFirstChunk = true

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.trim() === '') continue

        try {
          const parsedResponse = JSON.parse(line) as OllamaResponse
          if (parsedResponse.message?.content) {
            if (isFirstChunk) {
              log(wait(`    - Receiving streaming response from Ollama...`))
              isFirstChunk = false
            }
            fullContent += parsedResponse.message.content
          }

          if (parsedResponse.done) {
            log(wait(`    - Completed receiving response from Ollama.`))
          }
        } catch (parseError) {
          console.error(`Error parsing JSON: ${parseError}`)
        }
      }
    }

    // Write the full content to the output file
    await writeFile(tempPath, fullContent)
  } catch (error) {
    console.error(`Error in callOllama: ${error instanceof Error ? (error as Error).message : String(error)}`)
    console.error(`Stack Trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`)
    throw error
  }
}