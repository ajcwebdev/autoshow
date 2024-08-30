// src/llms/chatgpt.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { OpenAI } from 'openai'

const gptModel = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

export async function callChatGPT(transcriptContent, outputFilePath, model = 'GPT_4o_MINI') {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  try {
    const actualModel = gptModel[model] || gptModel.GPT_4o_MINI
    const response = await openai.chat.completions.create({
      model: actualModel,
      max_tokens: 4000,
      messages: [{ role: 'user', content: transcriptContent }],
    })
    const {
      choices: [{ message: { content }, finish_reason }],
      usage: { prompt_tokens, completion_tokens, total_tokens },
      model: usedModel
    } = response
    await writeFile(outputFilePath, content)
    console.log(`Transcript saved to ${outputFilePath}`)
    // console.log(`\nChatGPT response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finish_reason}\nModel: ${usedModel}`)
    console.log(`Token Usage:\n  - ${prompt_tokens} prompt tokens\n  - ${completion_tokens} completion tokens\n  - ${total_tokens} total tokens\n`)
    return Object.keys(gptModel).find(key => gptModel[key] === usedModel) || model
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}