// src/llms/mistral.js

import { writeFile } from 'fs/promises'
import { Mistral } from '@mistralai/mistralai'

const mistralModel = {
  MIXTRAL_8x7b: "open-mixtral-8x7b",
  MIXTRAL_8x22b: "open-mixtral-8x22b",
  MISTRAL_LARGE: "mistral-large-latest",
  MISTRAL_NEMO: "open-mistral-nemo"
}

export async function callMistral(transcriptContent, outputFilePath) {
  const mistral = new Mistral(process.env.MISTRAL_API_KEY)
  try {
    const response = await mistral.chat.complete({
      model: mistralModel.MISTRAL_NEMO,
      // max_tokens: ?,
      messages: [{ role: 'user', content: transcriptContent }],
    })
    const {
      choices: [{ message: { content }, finish_reason }],
      model,
      usage: { prompt_tokens, completion_tokens, total_tokens }
    } = response
    await writeFile(outputFilePath, content)
    console.log(`Transcript saved to ${outputFilePath}`)
    console.log(`\nMistral response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finish_reason}\nModel: ${model}`)
    console.log(`Token Usage:\n  - ${prompt_tokens} prompt tokens\n  - ${completion_tokens} completion tokens\n  - ${total_tokens} total tokens\n`)
  } catch (error) {
    console.error('Error:', error)
  }
}