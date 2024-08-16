// src/llms/claude.js

import fs from 'fs'
import { Anthropic } from '@anthropic-ai/sdk'

const claudeModel = {
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
}

export async function callClaude(transcriptContent, outputFilePath) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const response = await anthropic.messages.create({
    model: claudeModel.CLAUDE_3_HAIKU,
    max_tokens: 4000,
    messages: [{ role: 'user', content: transcriptContent }]
  })

  const { content: [{ text }], model, usage, stop_reason } = response

  fs.writeFileSync(outputFilePath, text, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Transcript saved to ${outputFilePath}`)
    }
  })

  console.log(`\nClaude response:\n\n${JSON.stringify(response, null, 2)}`)
  console.log(`\nStop Reason: ${stop_reason}\nModel: ${model}`)
  console.log(`Token Usage:\n  - ${usage.input_tokens} input tokens\n  - ${usage.output_tokens} output tokens\n`)
}