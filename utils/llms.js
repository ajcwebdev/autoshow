// utils/llms.js

import fs from 'fs'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { CohereClient } from 'cohere-ai'
import MistralClient from '@mistralai/mistralai'
import { OctoAIClient } from '@octoai/sdk'
import { gpt, claude, mistral, cohere } from './models.js'

const { GPT_4o, GPT_4_TURBO, GPT_4, GPT_3_TURBO } = gpt
const { OPUS, SONNET, HAIKU } = claude
const { COMMAND_R, COMMAND_R_PLUS } = cohere
const { MIXTRAL_8x7b, MIXTRAL_8x22b, MISTRAL_SMALL, MISTRAL_MEDIUM, MISTRAL_LARGE } = mistral

export async function callChatGPT(transcriptContent, outputFilePath) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const MESSAGE = [
    { role: 'system', content: fs.readFileSync(`./utils/prompt.md`, 'utf8') },
    { role: 'user', content: transcriptContent }
  ]

  const response = await openai.chat.completions.create({
    model: GPT_3_TURBO,
    messages: MESSAGE,
    max_tokens: 2000,
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

export async function callCohere(transcriptContent, outputFilePath) {
  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const response = await cohere.chat({
    model: COMMAND_R,
    chatHistory: [
      { role: 'USER', message: fs.readFileSync(`./utils/prompt.md`, 'utf8') },
      { role: 'USER', message: transcriptContent }
    ],
    message: 'Please generate show notes for the above transcript.'
  })

  console.log('Cohere response:', response) // Debugging statement
  console.log(`\n\nInput Tokens: ${response.meta.tokens.inputTokens}`)
  console.log(`\n\nOutput Tokens: ${response.meta.tokens.outputTokens}`)

  if (response.text) {
    fs.writeFileSync(outputFilePath, response.text, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })
  } else {
    console.error('Cohere API response did not contain content')
  }
}

export async function callMistral(transcriptContent, outputFilePath) {
  const mistral = new MistralClient(process.env.MISTRAL_API_KEY)

  const response = await mistral.chat({
    model: MISTRAL_SMALL,
    messages: [
      { role: 'user', content: fs.readFileSync(`./utils/prompt.md`, 'utf8') },
      { role: 'user', content: transcriptContent }
    ],
  })

  console.log('\nMistral response:', response) // Debugging statement
  console.log('\nPrompt tokens:', response.usage.prompt_tokens)
  console.log('Completion tokens:', response.usage.completion_tokens)

  if (response.choices && response.choices.length > 0) {
    const contentText = response.choices[0].message.content
    fs.writeFileSync(outputFilePath, contentText, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })
  } else {
    console.error('Mistral API response did not contain content')
  }
}

export async function callOcto(transcriptContent, outputFilePath) {
  const octoai = new OctoAIClient({
      apiKey: process.env.OCTOAI_TOKEN,
  })

  const messages = [
      { role: "system", content: fs.readFileSync(`./utils/prompt.md`, 'utf8') },
      { role: "user", content: transcriptContent }
  ]

  const response = await octoai.textGen.createChatCompletion({
      model: "meta-llama-3-8b-instruct",
      messages: messages
  })

  if (response.choices && response.choices.length > 0) {
      const contentText = response.choices[0].message.content
      fs.writeFileSync(outputFilePath, contentText, err => {
          if (err) {
              console.error('Error writing to file', err)
          } else {
              console.log(`Octo show notes saved to ${outputFilePath}`)
          }
      })
  } else {
      console.error('Octo API response did not contain content')
  }
}