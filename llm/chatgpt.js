// llm/chatgpt.js

import OpenAI from "openai"
import fs from "fs"
import { PROMPT } from "./prompt.js"
import { TRANSCRIPT } from "./transcript.js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MESSAGE = [
  { "role": "system", "content": PROMPT },
  { "role": "user", "content": TRANSCRIPT }
]

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: MESSAGE,
  // max_tokens: 1024,
  max_tokens: 256,
})

fs.writeFile('./content/chatgpt_shownotes.md', response.choices[0].message.content, err => {
  if (err) {
    console.error('Error writing to file', err)
  } else {
    console.log('Transcript saved to content/chatgpt_shownotes.md')
  }
})