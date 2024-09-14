// src/llms/llama.js

import { writeFile, mkdir } from 'node:fs/promises'
import { getLlama, LlamaChatSession } from "node-llama-cpp"
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const localModels = {
  LLAMA_MODEL: "Meta-Llama-3.1-8B-Instruct.IQ4_XS.gguf",
  LLAMA_HUGGING_FACE_URL: "https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF",
  GEMMA_MODEL: "gemma-2-2b-it-IQ4_XS.gguf",
  GEMMA_HUGGING_FACE_URL: "https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF",
}

const { GEMMA_MODEL, GEMMA_HUGGING_FACE_URL } = localModels

const MODEL_PATH = `./src/llms/models/${GEMMA_MODEL}`

if (!GEMMA_MODEL || !GEMMA_HUGGING_FACE_URL) {
  console.error('GEMMA_MODEL and GEMMA_HUGGING_FACE_URL must be set')
  process.exit(1)
}

async function downloadModel() {
  if (existsSync(MODEL_PATH)) return console.log(`\nModel already exists: ${MODEL_PATH}`)
  console.log(`Downloading ${GEMMA_MODEL}...`)
  try {
    await mkdir('./src/llms/models', { recursive: true })
    const { stderr } = await execAsync(`curl -L ${GEMMA_HUGGING_FACE_URL}/resolve/main/${GEMMA_MODEL} -o ${MODEL_PATH}`)
    if (stderr) console.error('Error:', stderr)
    console.log('Download completed')
  } catch (err) {
    console.error('Download failed:', err.message)
    throw new Error('Failed to download the model')
  }
}

export async function callLlama(promptAndTranscript, tempPath) {
  try {
    await downloadModel()
    const llama = await getLlama()
    const localModel = await llama.loadModel({ modelPath: MODEL_PATH })
    const context = await localModel.createContext()
    const session = new LlamaChatSession({ contextSequence: context.getSequence() })
    const response = await session.prompt(promptAndTranscript)
    await writeFile(tempPath, response)
    console.log(`\nTranscript saved to: ${tempPath}`)
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}