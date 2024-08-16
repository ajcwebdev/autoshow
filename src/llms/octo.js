// src/llms/octo.js

import { writeFile } from 'fs/promises'
import { OctoAIClient } from '@octoai/sdk'

const octoModel = {
  LLAMA_3_1_8B: "meta-llama-3.1-8b-instruct",
  LLAMA_3_1_70B: "meta-llama-3.1-70b-instruct",
  LLAMA_3_1_405B: "meta-llama-3.1-405b-instruct",
  MISTRAL_7B: "mistral-7b-instruct",
  MIXTRAL_8X_7B: "mixtral-8x7b-instruct",
  NOUS_HERMES_MIXTRAL_8X_7B: "nous-hermes-2-mixtral-8x7b-dpo",
  WIZARD_2_8X_22B: "wizardlm-2-8x22b",
}

export async function callOcto(transcriptContent, outputFilePath) {
  const octoai = new OctoAIClient({ apiKey: process.env.OCTOAI_API_KEY })
  try {
    const response = await octoai.textGen.createChatCompletion({
      model: octoModel.LLAMA_3_1_70B,
      // max_tokens: ?,
      messages: [{ role: "user", content: transcriptContent }]
    })
    const {
      choices: [{ message: { content }, finishReason }],
      model,
      usage: { promptTokens, completionTokens, totalTokens }
    } = response
    await writeFile(outputFilePath, content)
    console.log(`Octo show notes saved to ${outputFilePath}`)
    console.log(`\nOcto response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finishReason}\nModel: ${model}`)
    console.log(`Token Usage:\n  - ${promptTokens} prompt tokens\n  - ${completionTokens} completion tokens\n  - ${totalTokens} total tokens\n`)
  } catch (error) {
    console.error('Error:', error)
  }
}