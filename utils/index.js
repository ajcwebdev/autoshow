// utils/index.js

import fs from 'fs'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

export const ytAlias = `yt-dlp --no-warnings --extractor-args "youtube:player_client=ios,web"`
export const promptPath = `./utils/prompt.md`

export function getModel(modelType) {
  switch (modelType) {
    case 'base':
      return "whisper.cpp/models/ggml-base.bin"
    case 'medium':
      return "whisper.cpp/models/ggml-medium.bin"
    case 'large':
      return "whisper.cpp/models/ggml-large-v2.bin"
    default:
      console.error(`Unknown model type: ${modelType}`)
      process.exit(1)
  }
}

export function processLrcToTxt(id) {
  const lrcPath = `${id}.lrc`
  const txtPath = `${id}.txt`
  const lrcContent = fs.readFileSync(lrcPath, 'utf8')
  const txtContent = lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
    .join('\n')
  fs.writeFileSync(txtPath, txtContent)
  console.log(`Transcript file transformed successfully: ${id}.txt`)
  return txtContent
}

export function concatenateFinalContent(id, txtContent) {
  return [
    fs.readFileSync(`${id}.md`, 'utf8'),
    fs.readFileSync(`${promptPath}`, 'utf8'),
    txtContent
  ].join('\n')
}

export function cleanUpFiles(id) {
  const files = [`${id}.wav`, `${id}.lrc`, `${id}.txt`, `${id}.md`]
  for (const file of files) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
  }
}

export async function callChatGPT(transcriptContent, outputFilePath) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const MESSAGE = [
    { role: 'system', content: fs.readFileSync(`${promptPath}`, 'utf8') },
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
    model: HAIKU, // You can change this to the desired model
    max_tokens: 2000,
    temperature: 0,
    system: fs.readFileSync(`${promptPath}`, 'utf8'),
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