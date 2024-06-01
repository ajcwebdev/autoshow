// utils/llms.js

import fs from 'fs'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

export async function callChatGPT(transcriptContent, outputFilePath) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const MESSAGE = [
    { role: 'system', content: fs.readFileSync(`./utils/prompt.md`, 'utf8') },
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

export async function callClaude(transcriptContent, outputFilePath) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const OPUS = "claude-3-opus-20240229"
  const SONNET = "claude-3-sonnet-20240229"
  const HAIKU = "claude-3-haiku-20240307"

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    temperature: 0,
    system: fs.readFileSync(`./utils/prompt.md`, 'utf8'),
    messages: [
      { role: 'user', content: transcriptContent }
    ]
  })

  console.log('Claude response:', response) // Debugging statement

  if (response.content && response.content.length > 0) {
    const contentText = response.content.map(item => item.text).join('\n')
    fs.writeFileSync(outputFilePath, contentText, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })
  } else {
    console.error('Claude API response did not contain content')
  }
}