// src/llms/claude.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { Anthropic } from '@anthropic-ai/sdk'

// Define available Claude models
const claudeModel = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

/**
 * Main function to call Claude API.
 * @param {string} transcriptContent - The transcript content to process.
 * @param {string} outputFilePath - The file path to save the output.
 * @param {string} [model='CLAUDE_3_HAIKU'] - The Claude model to use.
 * @returns {Promise<string>} - The actual model name used.
 */
export async function callClaude(transcriptContent, outputFilePath, model = 'CLAUDE_3_HAIKU') {
  // Initialize the Anthropic client with the API key from environment variables
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  
  try {
    // Select the actual model to use, defaulting to CLAUDE_3_HAIKU if not specified
    const actualModel = claudeModel[model] || claudeModel.CLAUDE_3_HAIKU
    
    // Call the Anthropic messages API to create a chat completion
    const response = await anthropic.messages.create({
      model: actualModel,
      max_tokens: 4000, // Maximum number of tokens in the response
      messages: [{ role: 'user', content: transcriptContent }] // The input message (transcript content)
    })
    
    // Destructure the response to get relevant information
    const {
      content: [{ text }], // The generated text
      model: usedModel, // The actual model used
      usage: { input_tokens, output_tokens }, // Token usage information
      stop_reason // Reason why the generation stopped
    } = response
    
    // Write the generated text to the output file
    await writeFile(outputFilePath, text)
    
    console.log(`Transcript saved to ${outputFilePath}`)
    // console.log(`\nClaude response:\n\n${JSON.stringify(response, null, 2)}`) // Commented out detailed response logging
    console.log(`\nStop Reason: ${stop_reason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${input_tokens} input tokens\n  - ${output_tokens} output tokens\n`)
    
    // Return the actual model name used
    return Object.keys(claudeModel).find(key => claudeModel[key] === usedModel) || model
  } catch (error) {
    console.error('Error:', error)
    throw error // Re-throw the error for handling in the calling function
  }
}