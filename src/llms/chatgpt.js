// src/llms/chatgpt.js

import { writeFile } from 'fs/promises'
import { OpenAI } from 'openai'

const gptModel = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
}

export async function callChatGPT(transcriptContent, outputFilePath) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const response = await openai.chat.completions.create({
      model: gptModel.GPT_4o_MINI,
      max_tokens: 4000,
      messages: [{ role: 'user', content: transcriptContent }],
    })
    const {
      choices: [{ message: { content }, finish_reason }],
      usage: { prompt_tokens, completion_tokens, total_tokens },
      model
    } = response
    await writeFile(outputFilePath, content)
    console.log(`Transcript saved to ${outputFilePath}`)
    console.log(`\nChatGPT response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finish_reason}\nModel: ${model}`)
    console.log(`Token Usage:\n  - ${prompt_tokens} prompt tokens\n  - ${completion_tokens} completion tokens\n  - ${total_tokens} total tokens\n`)
  } catch (error) {
    console.error('Error:', error)
  }
}