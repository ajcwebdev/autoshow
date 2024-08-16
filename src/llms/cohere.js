// src/llms/cohere.js

import { writeFile } from 'fs/promises'
import { CohereClient } from 'cohere-ai'

const cohereModel = {
  COMMAND_R: "command-r",
  COMMAND_R_PLUS: "command-r-plus"
}

export async function callCohere(transcriptContent, outputFilePath) {
  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })
  try {
    const response = await cohere.chat({
      model: cohereModel.COMMAND_R,
      // max_tokens: ?,
      message: transcriptContent
    })
    const {
      text,
      meta: { tokens: { inputTokens, outputTokens } },
      finishReason
    } = response
    await writeFile(outputFilePath, text)
    console.log(`Transcript saved to ${outputFilePath}`)
    console.log(`\nCohere response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${cohereModel.COMMAND_R}`)
    console.log(`Token Usage:\n  - ${inputTokens} input tokens\n  - ${outputTokens} output tokens\n`)
  } catch (error) {
    console.error('Error:', error)
  }
}