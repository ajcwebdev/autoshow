// src/llms/claude.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Anthropic } from '@anthropic-ai/sdk'
import { CLAUDE_MODELS } from '../types.js'
import { log, wait } from '../types.js'

/** @import { LLMFunction, ClaudeModelType } from '../types.js' */

/** @type {LLMFunction} */
/**
 * Main function to call Claude API.
 * @param {string} promptAndTranscript - The combined prompt and transcript text to process.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {ClaudeModelType} [model='CLAUDE_3_HAIKU'] - The Claude model to use.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during the API call.
 */
export async function callClaude(promptAndTranscript, tempPath, model = 'CLAUDE_3_HAIKU') {
  // Check if the ANTHROPIC_API_KEY environment variable is set
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please set it to your Anthropic API key.')
  }

  // Initialize the Anthropic client with the API key from environment variables
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to CLAUDE_3_HAIKU if not specified
    const actualModel = CLAUDE_MODELS[model] || CLAUDE_MODELS.CLAUDE_3_HAIKU
    
    // Call the Anthropic messages API to create a chat completion
    const response = await anthropic.messages.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: promptAndTranscript }] // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      content: [{ text }], // The generated text
      model: usedModel, // The actual model used
      usage: { input_tokens, output_tokens }, // Token usage information
      stop_reason // Reason why the generation stopped
    } = response
    
    // Write the generated text to the output file
    await writeFile(tempPath, text)
    log(wait(`  - Stop Reason: ${stop_reason}\n  - Model: ${usedModel}`))
    log(wait(`  - Token Usage:\n    - ${input_tokens} input tokens\n    - ${output_tokens} output tokens`))
    
  } catch (error) {
    console.error(`Error in callClaude: ${error.message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}