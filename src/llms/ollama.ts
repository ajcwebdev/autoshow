// src/llms/ollama.ts

import { env } from 'node:process'
import { OLLAMA_MODELS } from '../utils/globals/llms'
import { l, err, logAPIResults } from '../utils/logging'
import { checkOllamaServerAndModel } from '../utils/validate-option'
import type { LLMFunction, OllamaModelType, OllamaResponse } from '../utils/types/llms'

/**
 * callOllama()
 * -----------
 * Main function to call the Llama-based model using the Ollama server API.
 *
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} tempPath - (unused) The temporary file path (no longer used).
 * @param {string | OllamaModelType} [model='QWEN_2_5_0B'] - The Ollama model to use.
 * @returns {Promise<string>} A Promise resolving with the generated text.
 */
export const callOllama: LLMFunction = async (
  prompt: string,
  transcript: string,
  model: string | OllamaModelType = 'QWEN_2_5_0B'
): Promise<string> => {
  l.wait('\n  callOllama called with arguments:')
  l.wait(`    - model: ${model}`)

  try {
    const modelKey = typeof model === 'string' ? model : 'QWEN_2_5_0B'
    const modelConfig = OLLAMA_MODELS[modelKey as OllamaModelType] || OLLAMA_MODELS.QWEN_2_5_0B
    const ollamaModelName = modelConfig.modelId

    l.wait(`    - modelName: ${modelKey}\n    - ollamaModelName: ${ollamaModelName}`)

    const ollamaHost = env['OLLAMA_HOST'] || 'localhost'
    const ollamaPort = env['OLLAMA_PORT'] || '11434'
    l.wait(`\n  Using Ollama host: ${ollamaHost}, port: ${ollamaPort}`)

    const combinedPrompt = `${prompt}\n${transcript}`

    await checkOllamaServerAndModel(ollamaHost, ollamaPort, ollamaModelName)

    l.wait(`    - Sending chat request to http://${ollamaHost}:${ollamaPort} using model '${ollamaModelName}'`)

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

    const data = await response.json() as OllamaResponse
    const fullContent = data?.message?.content || ''

    const totalPromptTokens = data.prompt_eval_count ?? 0
    const totalCompletionTokens = data.eval_count ?? 0

    logAPIResults({
      modelName: modelKey,
      stopReason: 'stop',
      tokenUsage: {
        input: totalPromptTokens || undefined,
        output: totalCompletionTokens || undefined,
        total: totalPromptTokens + totalCompletionTokens || undefined,
      },
    })

    return fullContent
  } catch (error) {
    err(`Error in callOllama: ${error instanceof Error ? error.message : String(error)}`)
    err(`Stack Trace: ${error instanceof Error ? error.stack : 'No stack trace available'}`)
    throw error
  }
}