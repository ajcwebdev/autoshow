// src/llms/ollama.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { spawn } from 'node:child_process'
import { OLLAMA_MODELS } from '../utils/globals'
import { l, err, logAPIResults } from '../utils/logging'
import type { LLMFunction, OllamaModelType, OllamaResponse, OllamaTagsResponse } from '../types/llms'

/**
 * callOllama()
 * -----------
 * Main function to call the Llama-based model using the Ollama server API.
 *
 * In a single-container approach:
 * - We assume 'ollama' binary is installed inside the container.
 * - We'll try to connect to 'localhost:11434' or a custom port from env,
 *   and if it's not running, we'll spawn `ollama serve`.
 */
export const callOllama: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string | OllamaModelType = 'LLAMA_3_2_3B'
) => {
  try {
    // Get the model configuration and ID
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_3B'
    const modelConfig = OLLAMA_MODELS[modelKey as OllamaModelType] || OLLAMA_MODELS.LLAMA_3_2_3B
    const ollamaModelName = modelConfig.modelId

    l.wait(`    - modelName: ${modelKey}\n    - ollamaModelName: ${ollamaModelName}`)
    
    // Host & port for Ollama
    const ollamaHost = env['OLLAMA_HOST'] || 'localhost'
    const ollamaPort = env['OLLAMA_PORT'] || '11434'

    // Check if Ollama server is up
    async function checkServer(): Promise<boolean> {
      try {
        const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
        return serverResponse.ok
      } catch (error) {
        return false
      }
    }

    if (await checkServer()) {
      l.wait('\n  Ollama server is already running...')
    } else {
      if (ollamaHost === 'ollama') {
        throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
      } else {
        l.wait('\n  Ollama server is not running. Attempting to start...')
        const ollamaProcess = spawn('ollama', ['serve'], {
          detached: true,
          stdio: 'ignore'
        })
        ollamaProcess.unref()

        // Wait for server to start
        let attempts = 0
        while (attempts < 30) {
          if (await checkServer()) {
            l.wait('    - Ollama server is now ready.')
            break
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
        }
        if (attempts === 30) {
          throw new Error('Ollama server failed to become ready in time.')
        }
      }
    }

    // Check and pull model if needed
    try {
      const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
      if (!tagsResponse.ok) {
        throw new Error(`HTTP error! status: ${tagsResponse.status}`)
      }
      const tagsData = await tagsResponse.json() as OllamaTagsResponse
      const isModelAvailable = tagsData.models.some(model => model.name === ollamaModelName)

      if (!isModelAvailable) {
        l.wait(`\n  Model ${ollamaModelName} is not available, pulling the model...`)
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
                l.wait(`    - Model ${ollamaModelName} has been pulled successfully...\n`)
                break
              }
            } catch (parseError) {
              err(`Error parsing JSON: ${parseError}`)
            }
          }
        }
      } else {
        l.wait(`\n  Model ${ollamaModelName} is already available...\n`)
      }
    } catch (error) {
      err(`Error checking/pulling model: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }

    l.wait(`    - Sending chat request to http://${ollamaHost}:${ollamaPort} using ${ollamaModelName} model`)

    // Call Ollama's /api/chat endpoint in streaming mode
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
    let totalPromptTokens = 0
    let totalCompletionTokens = 0

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
              l.wait(`    - Receiving streaming response from Ollama...`)
              isFirstChunk = false
            }
            fullContent += parsedResponse.message.content
          }

          // Accumulate token counts if available
          if (parsedResponse.prompt_eval_count) {
            totalPromptTokens = parsedResponse.prompt_eval_count
          }
          if (parsedResponse.eval_count) {
            totalCompletionTokens = parsedResponse.eval_count
          }

          if (parsedResponse.done) {
            // Log final results using standardized logging function
            logAPIResults({
              modelName: modelKey,
              stopReason: 'stop',
              tokenUsage: {
                input: totalPromptTokens || undefined,
                output: totalCompletionTokens || undefined,
                total: totalPromptTokens + totalCompletionTokens || undefined
              }
            })
          }
        } catch (parseError) {
          err(`Error parsing JSON: ${parseError}`)
        }
      }
    }

    // Write final content to the specified temp file
    await writeFile(tempPath, fullContent)

  } catch (error) {
    err(`Error in callOllama: ${error instanceof Error ? error.message : String(error)}`)
    err(`Stack Trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`)
    throw error
  }
}