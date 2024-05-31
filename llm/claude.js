// llm/claude.js

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

export async function generateClaudeShowNotes(transcriptContent, outputFilePath) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const OPUS = "claude-3-opus-20240229"
  const SONNET = "claude-3-sonnet-20240229"
  const HAIKU = "claude-3-haiku-20240307"

  const response = await anthropic.messages.create({
    model: HAIKU, // You can change this to the desired model
    max_tokens: 2000,
    temperature: 0,
    messages: [
      { role: 'system', content: fs.readFileSync('./utils/prompt.md', 'utf8') },
      { role: 'user', content: transcriptContent }
    ]
  })

  fs.writeFileSync(outputFilePath, response.choices[0].message.content, err => {
    if (err) {
      console.error('Error writing to file', err)
    } else {
      console.log(`Transcript saved to ${outputFilePath}`)
    }
  })
}