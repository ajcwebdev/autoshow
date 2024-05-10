// llm/claude.js

import Anthropic from "@anthropic-ai/sdk"
import fs from "fs"
import { PROMPT } from "./prompt.js"
import { TRANSCRIPT } from "./transcript.js"

const OPUS = "claude-3-opus-20240229"
const SONNET = "claude-3-sonnet-20240229"
const HAIKU = "claude-3-haiku-20240307"

const anthropic = new Anthropic()

const msg = await anthropic.messages.create({
//   model: OPUS,
//   model: SONNET,
  model: HAIKU,
  max_tokens: 2000,
  temperature: 0,
  system: PROMPT,
  messages: [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": TRANSCRIPT
        }
      ]
    }
  ]
})

const input_count = msg.usage.input_tokens
const output_count = msg.usage.output_tokens

console.log("\nInput tokens:", input_count)
console.log("Output tokens:", output_count)
console.log(`\n${OPUS}: $${((input_count / 1_000_000 * 15.00) + (output_count / 1_000_000 * 75.00)).toFixed(3)}`)
console.log(`${SONNET}: $${((input_count / 1_000_000 * 3.00) + (output_count / 1_000_000 * 15.00)).toFixed(3)}`)
console.log(`${HAIKU}: $${((input_count / 1_000_000 * 0.25) + (output_count / 1_000_000 * 1.25)).toFixed(3)}`)

fs.writeFile('./content/claude_shownotes.md', msg.content[0].text, err => {
  if (err) {
    console.error('Error writing to file', err)
  } else {
    console.log('\nTranscript saved to content/claude_shownotes.md\n')
  }
})