// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'
import { PROMPT } from '../llms/prompt.js'

export async function runTranscription(finalPath, transcriptionOption, options = {}) {
  try {
    let txtContent
    switch (transcriptionOption) {
      case 'deepgram':
        await callDeepgram(`${finalPath}.wav`, finalPath)
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break
      case 'assembly':
        await callAssembly(`${finalPath}.wav`, finalPath, options.speakerLabels, options.speakersExpected)
        txtContent = await readFile(`${finalPath}.txt`, 'utf8')
        break
      default:
        txtContent = await callWhisper(finalPath, transcriptionOption)
    }
    let mdContent = ''
    try {
      mdContent = await readFile(`${finalPath}.md`, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
    const finalContent = `${mdContent}\n${PROMPT}\n## Transcript\n\n${txtContent}`
    await writeFile(`${finalPath}-with-prompt.md`, finalContent)
    console.log(`\nMarkdown file with frontmatter, prompt, and transcript:\n  - ${finalPath}-with-prompt.md`)
    return finalContent
  } catch (error) {
    console.error('Error in runTranscription:', error)
    if (error.message === 'Transcription process failed' && error.stderr) {
      console.error('Transcription stderr output:', error.stderr)
    }
    throw error
  }
}