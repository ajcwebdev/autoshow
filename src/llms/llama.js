// src/llms/llama.js

import { writeFile, mkdir } from 'node:fs/promises'
import { getLlama, LlamaChatSession } from "node-llama-cpp"
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { LLAMA_MODELS } from '../models.js'
import { log, wait } from '../types.js'

const execAsync = promisify(exec)

/** @import { LlamaModelType } from '../types.js' */

/**
 * Function to download the model if it doesn't exist.
 * @param {LlamaModelType} [modelName='GEMMA_2_2B'] - The name of the model to use.
 * @returns {Promise<string>} - The path to the downloaded model.
 * @throws {Error} - If the model download fails.
 */
async function downloadModel(modelName = 'GEMMA_2_2B') {
  // Get the model object from LLAMA_MODELS using the provided modelName or default to GEMMA_2_2B
  const model = LLAMA_MODELS[modelName] || LLAMA_MODELS.GEMMA_2_2B
  log(wait(`    - Model selected: ${model.filename}`))

  // If no valid model is found, throw an error
  if (!model) {
    throw new Error(`Invalid model name: ${modelName}`)
  }

  // Construct the path where the model file should be stored
  const modelPath = `./src/llms/models/${model.filename}`

  // Check if the model file already exists
  if (existsSync(modelPath)) {
    log(wait(`    - Model path: ${modelPath}`))
    // Return the path if the model already exists
    return modelPath
  }

  log(wait(`\nDownloading ${model.filename}...`))
  try {
    // Create the directory for storing models if it doesn't exist
    await mkdir('./src/llms/models', { recursive: true })

    // Download the model using curl
    const { stderr } = await execAsync(`curl -L ${model.url} -o ${modelPath}`)

    // If there's any stderr output, log it
    if (stderr) log(stderr)
    log('Download completed')

    // Return the path to the downloaded model
    return modelPath
  } catch (err) {
    // If an error occurs during download, log it and throw a new error
    console.error(`Download failed: ${err.message}`)
    throw new Error('Failed to download the model')
  }
}

/** @type {LLMFunction} */
/**
 * Main function to call the local Llama model.
 * @param {string} promptAndTranscript - The combined prompt and transcript content.
 * @param {string} tempPath - The temporary file path to write the LLM output.
 * @param {LlamaModelType | boolean} [modelName=true] - The name of the model to use or true to use the default.
 * @returns {Promise<void>}
 * @throws {Error} - If an error occurs during processing.
 */
export async function callLlama(promptAndTranscript, tempPath, modelName = true) {
  try {
    // If modelName is true or not provided, use the default model
    const actualModelName = modelName === true ? 'GEMMA_2_2B' : modelName

    // Ensure the model is downloaded
    const modelPath = await downloadModel(actualModelName)

    // Initialize Llama and load the local model
    const llama = await getLlama()
    const localModel = await llama.loadModel({ modelPath })

    // Create a context for the model and create a chat session
    const context = await localModel.createContext()
    const session = new LlamaChatSession({ contextSequence: context.getSequence() })

    // Generate a response and write the response to a file
    const response = await session.prompt(promptAndTranscript)
    await writeFile(tempPath, response)
  } catch (error) {
    console.error(`Error in callLlama: ${error.message}`)
    throw error
  }
}