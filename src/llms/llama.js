// src/llms/llama.js

import { writeFile, mkdir } from 'node:fs/promises'
import { getLlama, LlamaChatSession } from "node-llama-cpp"
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { env } from 'node:process'

const execAsync = promisify(exec)

const { LLAMA_MODEL, HUGGING_FACE_URL } = env

if (!LLAMA_MODEL || !HUGGING_FACE_URL) {
  console.error('Environment variables LLAMA_MODEL and HUGGING_FACE_URL must be set')
  process.exit(1)
}

async function downloadModel() {
  const modelPath = `./src/llms/models/${LLAMA_MODEL}`
  if (existsSync(modelPath)) {
    console.log('Model already exists. Skipping download.')
    return
  }
  console.log(`Model not found. Attempting to download ${LLAMA_MODEL}...`)
  try {
    await mkdir('./src/llms/models', { recursive: true })
    console.log('Starting download...')
    const { stdout, stderr } = await execAsync(
      `curl -L ${HUGGING_FACE_URL}/resolve/main/${LLAMA_MODEL} -o ${modelPath}`
    )
    if (stderr) {
      console.error('Error output:', stderr)
    }
    console.log('Download completed.')
    if (stdout) {
      console.log('Command output:', stdout)
    }
  } catch (err) {
    console.error('Error during download:', err.message)
    throw new Error('Failed to download the required model.')
  }
}

export async function callLlama(transcriptContent, outputFilePath) {
  try {
    await downloadModel()
    const llama = await getLlama()
    const llamaModel = await llama.loadModel({
      modelPath: `./src/llms/models/${LLAMA_MODEL}`
    })
    const context = await llamaModel.createContext()
    const session = new LlamaChatSession({
      contextSequence: context.getSequence()
    })
    const response = await session.prompt(transcriptContent)
    console.log(response)
    await writeFile(outputFilePath, response)
    console.log(`Transcript saved to ${outputFilePath}`)
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}