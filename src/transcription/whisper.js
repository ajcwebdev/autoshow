// src/transcription/whisper.js

import { readFile, writeFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execPromise = promisify(exec)

export async function callWhisper(finalPath, whisperModelType) {                                // Main function to process audio files with Whisper
  try {
    const models = {                                                                            // Object mapping model types to their corresponding file names
      'tiny': "ggml-tiny.bin",
      'tiny.en': "ggml-tiny.en.bin",
      'base': "ggml-base.bin",
      'base.en': "ggml-base.en.bin",
      'small': "ggml-small.bin",
      'small.en': "ggml-small.en.bin",
      'medium': "ggml-medium.bin",
      'medium.en': "ggml-medium.en.bin",
      'large-v1': "ggml-large-v1.bin",
      'large-v2': "ggml-large-v2.bin",
      'large': "ggml-large-v2.bin"
    }
    if (!(whisperModelType in models)) {                                                        // Check if the provided model type is valid
      console.error(`Unknown model type: ${whisperModelType}`)                                  // Log error for unknown model type
      process.exit(1)                                                                           // Exit the process with an error code
    }
    const modelName = models[whisperModelType]                                                  // Get the file name for the selected model
    const modelPath = `./whisper.cpp/models/${modelName}`                                       // Construct the full path to the model file
    try {
      await access(modelPath)                                                                   // Check if the model file exists
      console.log(`Whisper model found: ${modelName}`)                                          // Log that the model was found
    } catch (error) {
      console.log(`Whisper model not found: ${modelName}`)                                      // If the model file doesn't exist, log it
      console.log(`Downloading model: ${whisperModelType}`)                                     // Log the start of the download process
      await execPromise(`bash ./whisper.cpp/models/download-ggml-model.sh ${whisperModelType}`) // Execute the download script
      console.log(`Model downloaded: ${whisperModelType}`)                                      // Log successful download
    }
    await execPromise(`./whisper.cpp/main \
      -m "whisper.cpp/models/${modelName}" \
      -f "${finalPath}.wav" \
      -of "${finalPath}" \
      --output-lrc`
    )                                                                                           // Execute the Whisper command-line tool
    console.log(`Whisper.cpp Model Selected:\n  - whisper.cpp/models/${modelName}`)             // Log the selected model
    console.log(`Transcript LRC file completed:\n  - ${finalPath}.lrc`)                         // Log the completion of the transcript
    const lrcContent = await readFile(`${finalPath}.lrc`, 'utf8')                               // Read the contents of the generated LRC file
    const txtContent = lrcContent.split('\n')                                                   // Split the content into lines
      .filter(line => !line.startsWith('[by:whisper.cpp]'))                                     // Remove the Whisper.cpp attribution line
      .map(line => line.replace(                                                                // Modify time stamps
        /\[(\d{2,3}):(\d{2})\.(\d{2})\]/g, (match, p1, p2) => `[${p1}:${p2}]`
      ))
      .join('\n')                                                                               // Join the lines back together
    await writeFile(`${finalPath}.txt`, txtContent)                                             // Write the transformed content to a new text file
    console.log(`Transcript transformation completed:\n  - ${finalPath}.txt`)                   // Log the completion of the transformation
    return txtContent                                                                           // Return the transformed text content
  } catch (error) {
    console.error('Error in callWhisper:', error)                                               // Log any errors that occur during the process
    throw error                                                                                 // Re-throw the error for handling by the caller
  }
}