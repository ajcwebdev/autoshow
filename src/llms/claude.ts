// src/llms/claude.ts

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Anthropic } from '@anthropic-ai/sdk'
import { l, wait, err, CLAUDE_MODELS } from '../globals.js'

import type { LLMFunction, ClaudeModelType } from '../types.js'

/**
 * Main function to call Claude API.
 * @param promptAndTranscript - The combined prompt and transcript text to process.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The Claude model to use.
 * @returns A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callClaude: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  model: string = 'CLAUDE_3_HAIKU'
): Promise<void> => {
  // Check if the ANTHROPIC_API_KEY environment variable is set
  if (!env['ANTHROPIC_API_KEY']) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please set it to your Anthropic API key.')
  }

  // Initialize the Anthropic client with the API key from environment variables
  const anthropic = new Anthropic({ apiKey: env['ANTHROPIC_API_KEY'] })
  
  try {
    // Select the actual model to use, defaulting to CLAUDE_3_HAIKU if not specified
    const actualModel = CLAUDE_MODELS[model as ClaudeModelType] || CLAUDE_MODELS.CLAUDE_3_HAIKU
    
    // Call the Anthropic messages API to create a chat completion
    const response = await anthropic.messages.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: promptAndTranscript }] // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      content,
      model: usedModel, // The actual model used
      usage, // Token usage information
      stop_reason // Reason why the generation stopped
    } = response
    
    // Extract text content from the response
    const textContent = extractTextContent(content)
    
    // Write the generated text to the output file
    if (textContent) {
      await writeFile(tempPath, textContent)
    } else {
      throw new Error('No text content generated from the API')
    }
    
    l(wait(`  - Stop Reason: ${stop_reason}\n  - Model: ${usedModel}`))
    
    // Check if usage information is available
    if (usage) {
      const { input_tokens, output_tokens } = usage
      l(wait(`  - Token Usage:\n    - ${input_tokens} input tokens\n    - ${output_tokens} output tokens`))
    } else {
      l(wait("  - Token usage information not available"))
    }
    
  } catch (error) {
    err(`Error in callClaude: ${(error as Error).message}`)
    throw error // Re-throw the error for handling in the calling function
  }
}

/**
 * Extracts text content from the API response
 * @param content - The content returned by the API
 * @returns The extracted text content, or null if no text content is found
 */
function extractTextContent(content: any[]): string | null {
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      if (block.type === 'text' && 'text' in block) {
        return block.text
      }
    }
  }
  return null
}