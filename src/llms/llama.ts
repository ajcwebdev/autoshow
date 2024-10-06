// src/llms/llama.ts

import { writeFile, mkdir } from 'node:fs/promises'
import { getLlama, LlamaChatSession } from "node-llama-cpp"
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { LLAMA_MODELS } from '../models.js'
import { log, wait } from '../types.js'

import type { LlamaModelType, LLMFunction } from '../types.js'

const execAsync = promisify(exec)

/**
 * Main function to call the local Llama model.
 * @param promptAndTranscript - The combined prompt and transcript content.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param model - The model name or undefined to use the default model.
 * @returns A Promise that resolves when the processing is complete.
 * @throws {Error} - If an error occurs during processing.
 */
export const callLlama: LLMFunction = async (promptAndTranscript: string, tempPath: string, model?: string) => {
  try {
    // Get the model object from LLAMA_MODELS using the provided model name or default to GEMMA_2_2B
    const selectedModel = LLAMA_MODELS[model as LlamaModelType] || LLAMA_MODELS.GEMMA_2_2B
    log(wait(`    - Model selected: ${selectedModel.filename}`))

    // If no valid model is found, throw an error
    if (!selectedModel) {
      throw new Error(`Invalid model name: ${model}`)
    }

    // Construct the path where the model file should be stored
    const modelPath = `./src/llms/models/${selectedModel.filename}`

    // Check if the model file already exists, if not, download it
    if (!existsSync(modelPath)) {
      log(wait(`\nDownloading ${selectedModel.filename}...`))

      try {
        // Create the directory for storing models if it doesn't exist
        await mkdir('./src/llms/models', { recursive: true })

        // Download the model using curl
        const { stderr } = await execAsync(`curl -L ${selectedModel.url} -o ${modelPath}`)

        // If there's any stderr output, log it
        if (stderr) log(stderr)
        log('Download completed')
      } catch (err) {
        // If an error occurs during download, log it and throw a new error
        console.error(`Download failed: ${err instanceof Error ? err.message : String(err)}`)
        throw new Error('Failed to download the model')
      }
    } else {
      log(wait(`    - Model path: ${modelPath}`))
    }

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
    console.error(`Error in callLlama: ${error instanceof Error ? (error as Error).message : String(error)}`)
    throw error
  }
}