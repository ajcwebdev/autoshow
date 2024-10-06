// src/utils/runTranscription.ts

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callWhisperDocker } from '../transcription/whisperDocker.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'
import { log, step, success, wait } from '../types.js'
import type { TranscriptServices, ProcessingOptions } from '../types.js'

/**
 * Main function to run transcription.
 * @param {string} finalPath - The base path for the files.
 * @param {string} frontMatter - Optional front matter content for the markdown file.
 * @param {TranscriptServices} transcriptServices - The transcription service to use.
 * @param {ProcessingOptions} [options] - Additional processing options.
 * @returns {Promise<string>} - Returns the final content including markdown and transcript.
 * @throws {Error} - If the transcription service fails or an error occurs during processing.
 */
export async function runTranscription(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  transcriptServices?: TranscriptServices
): Promise<string> {
  log(step(`\nStep 3 - Running transcription on audio file...`))
  try {
    let txtContent: string

    // Choose the transcription service based on the provided option
    switch (transcriptServices) {
      case 'deepgram':
        log(wait('\n  Using Deepgram for transcription...'))
        txtContent = await callDeepgram(options, finalPath)
        break

      case 'assembly':
        log(wait('\n  Using AssemblyAI for transcription...'))
        txtContent = await callAssembly(options, finalPath)
        break
      
      case 'whisperDocker':
        log(wait('\n  Using Whisper Docker for transcription...'))
        txtContent = await callWhisperDocker(options, finalPath)
        break  

      case 'whisper':
      default:
        log(wait('\n  Using Whisper for transcription...'))
        txtContent = await callWhisper(options, finalPath)
        break
    }

    let mdContent = frontMatter
    try {
      // Attempt to read existing markdown content
      const existingContent = await readFile(`${finalPath}.md`, 'utf8')
      mdContent += existingContent
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error reading markdown file: ${(error as Error).message}`)
        throw error
      }
      // If the file does not exist, proceed without appending
    }

    // Combine existing markdown content with the transcript
    const finalContent = `${mdContent}\n## Transcript\n\n${txtContent}`

    // Write final markdown file, including existing content and the new transcript
    await writeFile(`${finalPath}.md`, finalContent)
    log(success(`  Markdown file successfully updated with transcript:\n    - ${finalPath}.md`))

    return finalContent
  } catch (error) {
    console.error(`Error in transcription process: ${(error as Error).message}`)
    throw error
  }
}