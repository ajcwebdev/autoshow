// llm/chatgpt.js

import OpenAI from 'openai'
import fs from 'fs'

export async function generateShowNotes(transcriptContent, outputFilePath) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const MESSAGE = [
    { role: 'system', content: fs.readFileSync('prompt.md', 'utf8') },
    { role: 'user', content: transcriptContent }
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: MESSAGE,
    max_tokens: 256,
  })

  fs.writeFileSync(outputFilePath, response.choices[0].message.content, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Transcript saved to ${outputFilePath}`)
    }
  })
}