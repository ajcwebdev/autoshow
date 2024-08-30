// src/llms/cohere.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'

const cohereModel = {
  COMMAND_R: "command-r",
  COMMAND_R_PLUS: "command-r-plus"
}

export async function callCohere(transcriptContent, outputFilePath, model = 'COMMAND_R') {
  const cohere = new CohereClient({ token: env.COHERE_API_KEY })
  try {
    const actualModel = cohereModel[model] || cohereModel.COMMAND_R
    const response = await cohere.chat({
      model: actualModel,
      // max_tokens: ?, // Cohere doesn't seem to have a max_tokens parameter for chat
      message: transcriptContent
    })
    const {
      text,
      meta: { tokens: { inputTokens, outputTokens } },
      finishReason
    } = response
    await writeFile(outputFilePath, text)
    console.log(`Transcript saved to ${outputFilePath}`)
    // console.log(`\nCohere response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${actualModel}`)
    console.log(`Token Usage:\n  - ${inputTokens} input tokens\n  - ${outputTokens} output tokens\n`)
    return Object.keys(cohereModel).find(key => cohereModel[key] === actualModel) || model
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}