// src/llms/llama.ts

import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { LLAMA_MODELS } from '../models.js'
import { log, success, wait } from '../models.js'
import { getLlama, LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp"
import { createModelDownloader } from 'node-llama-cpp'

import type { LlamaModelType, LLMFunction } from '../types.js'

let model: LlamaModel | null = null
let context: LlamaContext | null = null

/**
 * Main function to call the local Llama model using node-llama-cpp API.
 * @param promptAndTranscript - The combined prompt and transcript content.
 * @param tempPath - The temporary file path to write the LLM output.
 * @param modelName - The model name or undefined to use the default model.
 * @returns A Promise that resolves when the processing is complete.
 * @throws {Error} - If an error occurs during processing.
 */
export const callLlama: LLMFunction = async (
  promptAndTranscript: string,
  tempPath: string,
  modelName?: string
) => {
  try {
    // Get the model object from LLAMA_MODELS using the provided model name or default to QWEN_2_5_1B
    const selectedModel = LLAMA_MODELS[modelName as LlamaModelType] || LLAMA_MODELS.QWEN_2_5_1B
    log(wait(`  - filename: ${selectedModel.filename}\n  - url: ${selectedModel.url}\n`))

    // If no valid model is found, throw an error
    if (!selectedModel) {
      throw new Error(`Invalid model name: ${modelName}`)
    }

    // Construct the path where the model file should be stored
    const modelDir = resolve('./src/llms/models')
    const modelPath = resolve(modelDir, selectedModel.filename)

    // Check if the model file already exists, if not, download it
    if (!existsSync(modelPath)) {
      log(wait(`\n  No model detected, downloading ${selectedModel.filename}...`))
      try {
        const downloader = await createModelDownloader({
          modelUri: selectedModel.url,
          dirPath: modelDir
        })
        await downloader.download()
        log(success('  Download completed'))
      } catch (err) {
        console.error(`Download failed: ${err instanceof Error ? err.message : String(err)}`)
        throw new Error('Failed to download the model')
      }
    } else {
      log(wait(`  modelPath found:\n    - ${modelPath}`))
    }

    // Initialize Llama and load the local model if not already loaded
    if (!model || !context) {
      const llama = await getLlama()
      model = await llama.loadModel({ modelPath })
      context = await model.createContext({ })
    }

    // Create a chat session
    const session = new LlamaChatSession({ contextSequence: context.getSequence() })

    // Generate a response
    const response = await session.prompt(promptAndTranscript, {
      maxTokens: -1,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      // repeatPenalty: 1.1
    })

    // Write the response to the temporary file
    await writeFile(tempPath, response)

    log(wait('\n  LLM processing completed'))
  } catch (error) {
    console.error(`Error in callLlama: ${error instanceof Error ? (error as Error).message : String(error)}`)
    throw error
  }
}