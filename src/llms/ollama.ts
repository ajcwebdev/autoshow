// src/llms/ollama.ts

import { env } from 'node:process'
import { spawn } from 'node:child_process'
import { l, err, logLLMCost } from '../utils/logging'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Type union of all `.value` fields for Ollama models in {@link LLM_SERVICES_CONFIG}.
 */
type OllamaModelValue = (typeof LLM_SERVICES_CONFIG.ollama.models)[number]['value']

/**
 * Structure representing Ollama's tags endpoint response.
 */
export type OllamaTagsResponse = {
  models: Array<{
    name: string
    model: string
    modified_at: string
    size: number
    digest: string
    details: {
      parent_model: string
      format: string
      family: string
      families: string[]
      parameter_size: string
      quantization_level: string
    }
  }>
}

/**
 * Calls a local Llama-based model via the Ollama server API.
 *
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param modelValue - The string key identifying which Ollama model to use (e.g. "qwen2.5:0.5b").
 * @returns The generated text from the Ollama model.
 * @throws If the Ollama server or model is unavailable, or any error occurs during the request.
 */
export async function callOllama(
  prompt: string,
  transcript: string,
  modelValue: OllamaModelValue = 'qwen2.5:0.5b'
): Promise<string> {
  l.dim('\n[callOllama] Arguments:')
  l.dim(`  - modelValue: ${modelValue}`)

  const ollamaHost = env['OLLAMA_HOST'] || 'localhost'
  const ollamaPort = env['OLLAMA_PORT'] || '11434'
  l.dim(`  - OLLAMA_HOST=${ollamaHost}, OLLAMA_PORT=${ollamaPort}`)

  try {
    await checkOllamaServerAndModel(ollamaHost, ollamaPort, modelValue)
    
    const combinedPrompt = `${prompt}\n${transcript}`
    l.dim(`\n[callOllama] Sending request to http://${ollamaHost}:${ollamaPort} using model '${modelValue}'`)

    const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelValue,
        messages: [{ role: 'user', content: combinedPrompt }],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const fullContent: string = data?.message?.content || ''

    // Log token usage if returned
    const totalPromptTokens = data.prompt_eval_count ?? 0
    const totalCompletionTokens = data.eval_count ?? 0
    logLLMCost({
      modelName: modelValue,
      stopReason: 'stop',
      tokenUsage: {
        input: totalPromptTokens || undefined,
        output: totalCompletionTokens || undefined,
        total:
          (totalPromptTokens + totalCompletionTokens) || undefined
      }
    })

    return fullContent
  } catch (error) {
    err(`Error in callOllama: ${(error as Error).message}`)
    throw error
  }
}

/**
 * Checks if the Ollama server is running, starts it if needed,
 * and ensures the specified model is pulled locally.
 *
 * @param ollamaHost - The Ollama host (defaults to "localhost").
 * @param ollamaPort - The Ollama port (defaults to "11434").
 * @param ollamaModelName - The model name (e.g. "qwen2.5:0.5b").
 * @throws If the server fails to start or the model cannot be pulled.
 */
export async function checkOllamaServerAndModel(
  ollamaHost: string,
  ollamaPort: string,
  ollamaModelName: OllamaModelValue
): Promise<void> {
  /**
   * Helper to check if Ollama server is responding at all.
   */
  async function checkServer(): Promise<boolean> {
    try {
      const serverResponse = await fetch(`http://${ollamaHost}:${ollamaPort}`)
      return serverResponse.ok
    } catch {
      return false
    }
  }

  l.dim(`[checkOllamaServerAndModel] Checking server: http://${ollamaHost}:${ollamaPort}`)

  // 1) Confirm the server is running
  if (await checkServer()) {
    l.dim('  Ollama server is already running.')
  } else {
    if (ollamaHost === 'ollama') {
      // Possibly the Docker-based environment needs the server pre-running:
      throw new Error('Ollama server is not running or not accessible at hostname "ollama".')
    } else {
      // Attempt to spawn it locally
      l.dim('\n  Ollama server is not running. Attempting to start it locally...')
      const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      })
      ollamaProcess.unref()

      // Wait up to ~30 seconds for readiness
      let attempts = 0
      while (attempts < 30) {
        if (await checkServer()) {
          l.dim('  Ollama server is now running.')
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }
      if (attempts === 30) {
        throw new Error('Ollama server did not become ready in time.')
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
    l.dim(`    isModelAvailable=${isModelAvailable}`)

    if (!isModelAvailable) {
      l.dim(`  Model '${ollamaModelName}' not found; pulling now...`)
      const pullResponse = await fetch(`http://${ollamaHost}:${ollamaPort}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaModelName })
      })

      if (!pullResponse.ok) {
        throw new Error(`Failed to initiate pull for model: ${ollamaModelName}`)
      }
      if (!pullResponse.body) {
        throw new Error('Empty response body when pulling model.')
      }

      const reader = pullResponse.body.getReader()
      const decoder = new TextDecoder()

      // Stream JSON lines from the server until success
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.trim() === '') continue
          try {
            const parsedLine = JSON.parse(line)
            if (parsedLine.status === 'success') {
              l.dim(`  Successfully pulled model '${ollamaModelName}'.`)
              return
            }
          } catch (parseError) {
            err(`Error parsing JSON while pulling model: ${(parseError as Error).message}`)
          }
        }
      }
    } else {
      l.dim(`  Model '${ollamaModelName}' is already available.`)
    }
  } catch (error) {
    err(`Error pulling model '${ollamaModelName}': ${(error as Error).message}`)
    throw error
  }
}