// utils/llms/ollama.js

import fs from 'fs'
// import ollama from 'ollama'

import { Ollama } from 'ollama'

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3'

export async function callOllama(transcriptContent, outputFilePath) {
  try {
    console.log(`Calling Ollama with model: ${OLLAMA_MODEL}`)

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: transcriptContent }],
    })

    const { content } = response.message

    fs.writeFileSync(outputFilePath, content, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })

    console.log(`\nOllama response:\n\n${JSON.stringify(response, null, 2)}`)
  } catch (error) {
    console.error('Error calling Ollama:', error)
  }
}