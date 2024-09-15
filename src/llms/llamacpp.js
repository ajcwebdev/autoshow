// src/llms/llamacpp.js

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'

const execAsync = promisify(exec)

// Main function to call Llama.cpp using Docker
export async function callLlamaCpp(fullPrompt, tempOutputPath, options = {}) {
  try {
    // Set default options or use provided options
    const modelPath = options.modelPath || '/app/models/gemma-2-2b-it-IQ4_XS.gguf'
    const nThreads = options.nThreads || 4
    const nPredict = options.nPredict || 1024

    // Construct the Docker command
    const dockerCommand = `docker run --rm \
      -v ${process.cwd()}/content:/app/content \
      llama ./build/bin/main \
      -m ${modelPath} \
      -n ${nPredict} \
      -t ${nThreads} \
      -p "${fullPrompt}"`
    console.log('Running llama.cpp with Docker command:', dockerCommand)

    // Execute the Docker command and check for/log any errors
    const { stdout, stderr } = await execAsync(dockerCommand)
    if (stderr) {
      console.error('Error running llama.cpp:', stderr)
    }
    console.log('llama.cpp output:', stdout)

    // Write the output to the specified temporary file
    await writeFile(tempOutputPath, stdout)
    console.log(`Llama.cpp output saved to ${tempOutputPath}`)
  } catch (error) {
    // Log and re-throw any errors that occur during the process
    console.error('Error in callLlama:', error)
    throw error
  }
}