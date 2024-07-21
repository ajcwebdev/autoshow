import fs from 'fs'
import { OpenAI } from 'openai'

const gptModel = {
  GPT_4o_MINI: "gpt-4o-mini",
  GPT_4o: "gpt-4o",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4: "gpt-4",
  GPT_3_TURBO: "gpt-3.5-turbo",
}

export async function callChatGPT(transcriptContent, outputFilePath) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  
    const response = await openai.chat.completions.create({
      model: gptModel.GPT_4o_MINI,
      max_tokens: 4000,
      messages: [{ role: 'user', content: transcriptContent }],
    })
  
    const { choices: [{ message: { content }, finish_reason }], usage, model } = response
  
    fs.writeFileSync(outputFilePath, content, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })
  
    console.log(`\nChatGPT response:\n\n${JSON.stringify(response, null, 2)}`)
    console.log(`\nFinish Reason: ${finish_reason}\nModel: ${model}`)
    console.log(`Token Usage:\n  - ${usage.prompt_tokens} prompt tokens\n  - ${usage.completion_tokens} completion tokens\n  - ${usage.total_tokens} total tokens\n`)
  }