// src/llms/claude.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Anthropic } from '@anthropic-ai/sdk'

/** @import { LLMFunction, ClaudeModelType } from '../types.js' */

/**
 * Map of Claude model identifiers to their API names
 * @type {Record<ClaudeModelType, string>}
 */
const claudeModel = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

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
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.')
  }

  // Initialize the Anthropic client with the API key from environment variables
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to CLAUDE_3_HAIKU if not specified
    const actualModel = claudeModel[model] || claudeModel.CLAUDE_3_HAIKU
    
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
    // console.log(`\nClaude response:\n\n${JSON.stringify(response, null, 2)}`) // Commented out detailed response logging
    console.log(`  - Stop Reason: ${stop_reason}\n  - Model: ${usedModel}`)
    console.log(`  - Token Usage:\n    - ${input_tokens} input tokens\n    - ${output_tokens} output tokens`)
    
  } catch (error) {
    console.error('Error:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}