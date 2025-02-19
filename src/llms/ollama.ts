// src/llms/ollama.ts

import { env } from 'node:process'
import { l, err, logLLMCost } from '../utils/logging'
import { spawn } from 'node:child_process'
import type { OllamaTagsResponse } from '../../shared/constants'

/**
 * callOllama()
 * -----------
 * Main function to call the Llama-based model using the Ollama server API.
 *
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model='qwen2.5:0.5b'] - The Ollama model to use.
 * @returns {Promise<string>} A Promise resolving with the generated text.
 */
export const callOllama = async (
  prompt: string,
  transcript: string,
  model: string
) => {
  l.dim('\n  callOllama called with arguments:')
  l.dim(`    - model: ${model}`)

  try {
    // Determine the final modelKey from the argument
    const modelKey = typeof model === 'string' ? model : 'qwen2.5:0.5b'
    l.dim(`    - modelKey: ${modelKey}`)

    // Determine host/port from environment or fallback
    const ollamaHost = env['OLLAMA_HOST'] || 'localhost'
    const ollamaPort = env['OLLAMA_PORT'] || '11434'
    l.dim(`\n  [callOllama] OLLAMA_HOST=${ollamaHost}, OLLAMA_PORT=${ollamaPort}`)

    // Combine prompt + transcript
    const combinedPrompt = `${prompt}\n${transcript}`

    // Ensure Ollama server is running and that the model is pulled
    await checkOllamaServerAndModel(ollamaHost, ollamaPort, modelKey)

    l.dim(`\n  Sending chat request to http://${ollamaHost}:${ollamaPort} using model '${modelKey}'`)

    // Make the actual request to Ollama
    const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelKey,
        messages: [{ role: 'user', content: combinedPrompt }],
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse returned JSON
    const data = (await response.json())
    const fullContent = data?.message?.content || ''

    // Log token usage if provided by the server
    const totalPromptTokens = data.prompt_eval_count ?? 0
    const totalCompletionTokens = data.eval_count ?? 0

    logLLMCost({
      modelName: modelKey,
      stopReason: 'stop',
      tokenUsage: {
        input: totalPromptTokens || undefined,
        output: totalCompletionTokens || undefined,
        total: (totalPromptTokens + totalCompletionTokens) || undefined,
      },
    })

    return fullContent
  } catch (error) {
    err(`Error in callOllama: ${error instanceof Error ? error.message : String(error)}`)
    err(`Stack Trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`)
    throw error
  }
}

/**
 * checkOllamaServerAndModel()
 * ---------------------
 * Checks if the Ollama server is running, attempts to start it if not,
 * and ensures the specified model is available (pulling if needed).
 *
 * @param {string} ollamaHost - The Ollama host
 * @param {string} ollamaPort - The Ollama port
 * @param {string} ollamaModelName - The Ollama model name (e.g. 'qwen2.5:0.5b')
 * @returns {Promise<void>}
 */
export async function checkOllamaServerAndModel(
  ollamaHost: string,
  ollamaPort: string,
  ollamaModelName: string
) {
  // Helper to check if the Ollama server responds
  async function checkServer(): Promise<boolean> {
    try {
      const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
      return serverResponse.ok
    } catch (error) {
      return false
    }
  }

  l.dim(`[checkOllamaServerAndModel] Checking server: http://${ollamaHost}:${ollamaPort}`)

  // 1) Confirm the server is running
  if (await checkServer()) {
    l.dim('\n  Ollama server is already running...')
  } else {
    // If the Docker-based environment uses 'ollama' as hostname but it's not up, that's likely an error
    if (ollamaHost === 'ollama') {
      throw new Error('Ollama server is not running. Please ensure the Ollama server is running and accessible.')
    } else {
      // Attempt to spawn an Ollama server locally
      l.dim('\n  Ollama server is not running. Attempting to start it locally...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      ollamaProcess.unref()

      // Wait up to ~30 seconds for the server to respond
      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.dim('    - Ollama server is now ready.\n')
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
      if (attempts === 30) {
        throw new Error('Ollama server failed to become ready in time.')
      }
    }
  }

  // 2) Confirm the model is available; if not, pull it
  l.dim(`  Checking if model is available: ${ollamaModelName}`)
  try {
    const tagsResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/tags`)
    if (!tagsResponse.ok) {
      throw new Error(`HTTP error! status: ${tagsResponse.status}`)
    }

    const tagsData = (await tagsResponse.json()) as OllamaTagsResponse
    const isModelAvailable = tagsData.models.some((m) => m.name === ollamaModelName)
    l.dim(`[checkOllamaServerAndModel] isModelAvailable=${isModelAvailable}`)

    if (!isModelAvailable) {
      l.dim(`\n  Model ${ollamaModelName} is NOT available; pulling now...`)
      const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaModelName }),
      })
      if (!pullResponse.ok) {
        throw new Error(`Failed to initiate pull for model ${ollamaModelName}`)
      }
      if (!pullResponse.body) {
        throw new Error('Response body is null while pulling model.')
      }

      const reader = pullResponse.body.getReader()
      const decoder = new TextDecoder()

      // Stream the JSON lines from the server
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.trim() === '') continue

          // Each line should be a JSON object from the Ollama server
          try {
            const parsedLine = JSON.parse(line)
            if (parsedLine.status === 'success') {
              l.dim(`    - Model ${ollamaModelName} pulled successfully.\n`)
              break
            }
          } catch (parseError) {
            err(`Error parsing JSON while pulling model: ${parseError}`)
          }
        }
      }
    } else {
      l.dim(`\n  Model ${ollamaModelName} is already available.\n`)
    }
  } catch (error) {
    err(`Error checking/pulling model: ${(error as Error).message}`)
    throw error
  }
}