// src/llms/cohere.js

import fs from 'fs'
import { CohereClient } from 'cohere-ai'

const cohereModel = {
  COMMAND_R: "command-r",
  COMMAND_R_PLUS: "command-r-plus",
  COMMAND: "command",
  COMMAND_LIGHT: "command-light"
}

export async function callCohere(transcriptContent, outputFilePath) {
  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const response = await cohere.chat({
    model: cohereModel.COMMAND_LIGHT,
    message: transcriptContent
  })

  const { text, meta: { tokens }, finishReason } = response

  fs.writeFileSync(outputFilePath, text, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Transcript saved to ${outputFilePath}`)
    }
  })

  console.log(`\nCohere response:\n\n${JSON.stringify(response, null, 2)}`)
  console.log(`\nFinish Reason: ${finishReason}\nModel: ${cohereModel.COMMAND_LIGHT}`)
  console.log(`Token Usage:\n  - ${tokens.inputTokens} input tokens\n  - ${tokens.outputTokens} output tokens\n`)
}