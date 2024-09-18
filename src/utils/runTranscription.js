// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'

/**
 * Main function to run transcription.
 * @param {string} finalPath - The base path for the files.
 * @param {string} transcriptionService - The transcription service to use.
 * @param {object} [options={}] - Additional options for processing.
 * @param {string} [frontMatter=''] - Optional front matter content for the markdown file.
 * @returns {Promise<string>} - Returns the final content including markdown and transcript.
 */
export async function runTranscription(finalPath, transcriptionService, options = {}, frontMatter = '') {
  try {
    let txtContent

    // Choose the transcription service based on the provided option
    switch (transcriptionService) {
      case 'deepgram':
        // Use Deepgram for transcription and read the transcription result
        await callDeepgram(`${finalPath}.wav`, finalPath)
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break

      case 'assembly':
        // Use AssemblyAI for transcription, pass options for speaker labels and number of speakers
        await callAssembly(
          `${finalPath}.wav`, 
          finalPath, 
          options.speakerLabels, 
          options.speakersExpected
        )
        // Read the transcription result
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break

      case 'whisper-docker':
      case 'whisper':
        // Use Whisper (either local or Docker version) for transcription
        txtContent = await callWhisper(finalPath, transcriptionService, options)
        break

      default:
        // If no service is specified, default to Whisper
        console.log('No transcription service specified, defaulting to Whisper')
        txtContent = await callWhisper(finalPath, transcriptionService, options)
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