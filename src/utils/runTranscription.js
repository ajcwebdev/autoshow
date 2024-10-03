// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'

/** @import { TranscriptOption, ProcessingOptions } from '../types.js' */

/**
 * Main function to run transcription.
 * @param {string} finalPath - The base path for the files.
 * @param {TranscriptOption} transcriptOpt - The transcription service to use.
 * @param {ProcessingOptions} [options={}] - Additional processing options.
 * @param {string} [frontMatter=''] - Optional front matter content for the markdown file.
 * @returns {Promise<string>} - Returns the final content including markdown and transcript.
 * @throws {Error} - If the transcription service fails or an error occurs during processing.
 */
export async function runTranscription(
  finalPath,
  transcriptOpt = 'whisper',
  options = {},
  frontMatter = ''
) {
  try {
    let txtContent

    // Choose the transcription service based on the provided option
    switch (transcriptOpt) {
      case 'deepgram':
        console.log('\nStep 3 - Using Deepgram for transcription...')
        await callDeepgram(`${finalPath}.wav`, finalPath)
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break

      case 'assembly':
        console.log('\nStep 3 - Using AssemblyAI for transcription...')
        txtContent = await callAssembly(finalPath, transcriptOpt, options)
        break

      case 'whisperDocker':
      case 'whisper':
        console.log('\nStep 3 - Using Whisper for transcription...')
        txtContent = await callWhisper(finalPath, transcriptOpt, options)
        break

      default:
        console.error(`Error: Unsupported transcription option '${transcriptOpt}'.`)
        throw new Error('Unsupported transcription option.')
    }

    let mdContent = frontMatter
    try {
      // Attempt to read existing markdown content
      const existingContent = await readFile(`${finalPath}.md`, 'utf8')
      mdContent += existingContent
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading markdown file: ${error.message}`)
        throw error
      }
      // If the file does not exist, proceed without appending
    }

    // Combine existing markdown content with the transcript
    const finalContent = `${mdContent}\n## Transcript\n\n${txtContent}`

    // Write final markdown file, including existing content and the new transcript
    await writeFile(`${finalPath}.md`, finalContent)
    console.log(`  - Markdown file updated with transcript at ${finalPath}.md`)

    return finalContent
  } catch (error) {
    console.error(`Error in transcription process: ${error.message}`)
    throw error
  }
}