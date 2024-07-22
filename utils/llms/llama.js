// utils/llms/llama.js

import fs from 'fs'
import path from "path"
import { fileURLToPath } from "url"
import { getLlama, LlamaChatSession } from "node-llama-cpp"

const { LLAMA_MODEL } = process.env

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const llama = await getLlama()
const model = await llama.loadModel({
  modelPath: path.join(__dirname, "models", LLAMA_MODEL)
})
const context = await model.createContext()
const session = new LlamaChatSession({
  contextSequence: context.getSequence()
})

export async function callLlama(transcriptContent, outputFilePath) {
  try {
    console.log("User: " + transcriptContent)
    const response = await session.prompt(transcriptContent)
    console.log("AI: " + response)
    fs.writeFileSync(outputFilePath, response, err => {
      if (err) {
        console.error('Error writing to file', err)
      } else {
        console.log(`Transcript saved to ${outputFilePath}`)
      }
    })
  } catch (error) {
    console.error('Error calling Llama:', error)
  }
}