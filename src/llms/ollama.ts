// src/llms/ollama.ts

import { env } from 'node:process'
import { OLLAMA_MODELS } from '../utils/step-utils/llm-utils'
import { l, err } from '../utils/logging'
import { logLLMCost, checkOllamaServerAndModel } from '../utils/step-utils/llm-utils'
import type { OllamaModelType } from '../utils/types/llms'

/**
 * callOllama()
 * -----------
 * Main function to call the Llama-based model using the Ollama server API.
 *
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string | OllamaModelType} [model='QWEN_2_5_0B'] - The Ollama model to use.
 * @returns {Promise<string>} A Promise resolving with the generated text.
 */
export const callOllama = async (
  prompt: string,
  transcript: string,
  model: string | OllamaModelType = 'QWEN_2_5_0B'
) => {
  l.dim('\n  callOllama called with arguments:')
  l.dim(`    - model: ${model}`)

  try {
    // Determine the final modelKey from the argument
    const modelKey = typeof model === 'string' ? model : 'QWEN_2_5_0B'
    const modelConfig = OLLAMA_MODELS[modelKey as OllamaModelType] || OLLAMA_MODELS.QWEN_2_5_0B
    const ollamaModelName = modelConfig.modelId

    l.dim(`    - modelName: ${modelKey}\n    - ollamaModelName: ${ollamaModelName}`)

    // Determine host/port from environment or fallback
    const ollamaHost = env['OLLAMA_HOST'] || 'localhost'
    const ollamaPort = env['OLLAMA_PORT'] || '11434'
    l.dim(`\n  [callOllama] OLLAMA_HOST=${ollamaHost}, OLLAMA_PORT=${ollamaPort}`)

    // Combine prompt + transcript
    const combinedPrompt = `${prompt}\n${transcript}`

    // Ensure Ollama server is running and that the model is pulled
    await checkOllamaServerAndModel(ollamaHost, ollamaPort, ollamaModelName)

    l.dim(`\n  Sending chat request to http://${ollamaHost}:${ollamaPort} using model '${ollamaModelName}'`)

    // Make the actual request to Ollama
    const response = await fetch(`http://${ollamaHost}:${ollamaPort}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModelName,
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