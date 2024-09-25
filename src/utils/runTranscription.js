// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'

/**
 * @typedef {Object} transcriptOptions
 * @property {boolean} [speakerLabels=false] - Whether to use speaker labels.
 * @property {string[]} [prompt] - Sections to include in the prompt.
 * @property {string} [whisper] - Whisper model type.
 * @property {string} [whisperDocker] - Whisper model type for Docker.
 * // Include other properties used in options.
 */

/**
 * Main function to run transcription.
 * @param {string} finalPath - The base path for the files.
 * @param {string} transcriptOpt - The transcription service to use.
 * @param {transcriptOptions} [options={}] - Additional options for processing.
 * @param {string} [frontMatter=''] - Optional front matter content for the markdown file.
 * @returns {Promise<string>} - Returns the final content including markdown and transcript.
 * @throws {Error} - If the transcription service fails or an error occurs during processing.
 */
export async function runTranscription(
  finalPath,
  transcriptOpt,
  options = {},
  frontMatter = ''
) {
  try {
    let txtContent

    // Choose the transcription service based on the provided option
    switch (transcriptOpt) {
      case 'deepgram':
        // Use Deepgram for transcription and read the transcription result
        await callDeepgram(`${finalPath}.wav`, finalPath)
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break

      case 'assembly':
        // Use AssemblyAI for transcription and pass option for speaker labels
        txtContent = await callAssembly(finalPath, transcriptOpt, options)
        break

      case 'whisperDocker':
      case 'whisper':
        // Use Whisper (either local or Docker version) for transcription
        txtContent = await callWhisper(finalPath, transcriptOpt, options)
        break

      default:
        // If no service is specified, default to Whisper
        console.log('No transcription service specified, defaulting to Whisper')
        txtContent = await callWhisper(finalPath, transcriptOpt, options)
        break
    }

    let mdContent = frontMatter
    try {
      // Attempt to read existing markdown content
      const existingContent = await readFile(`${finalPath}.md`, 'utf8')
      mdContent += existingContent
    } catch (error) {
      // If the file doesn't exist, ignore the error
      if (error.code !== 'ENOENT') {
        throw error // Re-throw if it's not a 'file not found' error
      }
    }

    // Combine existing markdown content with the transcript
    const finalContent = `${mdContent}\n## Transcript\n\n${txtContent}`

    // Write final markdown file, including existing content and the new transcript
    await writeFile(`${finalPath}.md`, finalContent)
    console.log(`Markdown file with frontmatter and transcript:\n  - ${finalPath}.md`)

    // Return final content including the original markdown and transcript
    return finalContent
  } catch (error) {
    // Log any errors that occur during the transcription process
    console.error('Error in runTranscription:', error)
    throw error // Re-throw the error for handling by the calling function
  }
}