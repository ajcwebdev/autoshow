// src/llms/octo.js

import fs from 'fs'
import { OctoAIClient } from '@octoai/sdk'

const octoModel = {
  LLAMA_3_8B: "meta-llama-3-8b-instruct",
  LLAMA_3_70B: "meta-llama-3-70b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  MIXTRAL_8X_22B: "mixtral-8x22b-instruct",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

export async function callOcto(transcriptContent, outputFilePath) {
  const octoai = new OctoAIClient({
    apiKey: process.env.OCTOAI_API_KEY,
  })

  const response = await octoai.textGen.createChatCompletion({
    model: octoModel.LLAMA_3_70B,
    messages: [{ role: "user", content: transcriptContent }]
  })

  const { choices: [{ message: { content }, finishReason }], model, usage } = response

  fs.writeFileSync(outputFilePath, content, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Octo show notes saved to ${outputFilePath}`)
    }
  })

  console.log(`\nOcto response:\n\n${JSON.stringify(response, null, 2)}`)
  console.log(`\nFinish Reason: ${finishReason}\nModel: ${model}`)
  console.log(`Token Usage:\n  - ${usage.promptTokens} prompt tokens\n  - ${usage.completionTokens} completion tokens\n  - ${usage.totalTokens} total tokens\n`)
}