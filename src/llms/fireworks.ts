// src/llms/fireworks.ts

import { env } from '../utils/node-utils'
import { err } from '../utils/logging'
import { LLM_SERVICES_CONFIG } from '../../shared/constants'

/**
 * Type union of all `.modelId` fields for Fireworks models in {@link LLM_SERVICES_CONFIG}.
 */
type FireworksModelValue = (typeof LLM_SERVICES_CONFIG.fireworks.models)[number]['modelId']

/**
 * Calls the Fireworks AI API and returns generated text.
 *
 * @param prompt - The prompt or instructions to process.
 * @param transcript - The transcript text to be appended to the prompt.
 * @param modelValue - The string key identifying which Fireworks model to use (e.g. "accounts/fireworks/models/llama-v3p1-8b-instruct").
 * @returns The generated text from Fireworks AI.
 * @throws If the `FIREWORKS_API_KEY` is missing or no valid response content is found.
 */
export async function callFireworks(
  prompt: string,
  transcript: string,
  modelValue: FireworksModelValue
) {
  if (!env['FIREWORKS_API_KEY']) {
    throw new Error('Missing FIREWORKS_API_KEY environment variable.')
  }

  const combinedPrompt = `${prompt}\n${transcript}`
  const requestBody = {
    model: modelValue,
    messages: [{ role: 'user', content: combinedPrompt }]
  }

  try {
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env['FIREWORKS_API_KEY']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Fireworks API error: ${res.status} ${res.statusText} - ${errorText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No content generated by the Fireworks API.')
    }

    return {
      content,
      usage: {
        stopReason: data.choices?.[0]?.finish_reason ?? 'unknown',
        input: data.usage?.prompt_tokens,
        output: data.usage?.completion_tokens,
        total: data.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`Error in callFireworks: ${(error as Error).message}`)
    throw error
  }
}