// src/llms/llamacpp.js

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'

const execAsync = promisify(exec)

export async function callLlamaCpp(fullPrompt, tempOutputPath, options = {}) {
  try {
    const modelPath = options.modelPath || '/app/models/Meta-Llama-3.1-8B-Instruct.IQ4_XS.gguf'
    const nThreads = options.nThreads || 4
    const nPredict = options.nPredict || 1024
    const dockerCommand = `docker run --rm \
      -v ${process.cwd()}/content:/app/content \
      llama ./build/bin/main \
      -m ${modelPath} \
      -n ${nPredict} \
      -t ${nThreads} \
      -p "${fullPrompt}"`
    console.log('Running llama.cpp with Docker command:', dockerCommand)
    const { stdout, stderr } = await execAsync(dockerCommand)
    if (stderr) {
      console.error('Error running llama.cpp:', stderr)
    }
    console.log('llama.cpp output:', stdout)
    await writeFile(tempOutputPath, stdout)
    console.log(`Llama.cpp output saved to ${tempOutputPath}`)
  } catch (error) {
    console.error('Error in callLlama:', error)
    throw error
  }
}