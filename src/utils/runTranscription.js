// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { callDeepgram } from '../transcription/deepgram.js'
import { callAssembly } from '../transcription/assembly.js'

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
      case 'whisper-docker':
      case 'whisper':
        txtContent = await callWhisper(finalPath, transcriptionOption, options)
        break
      default:
        throw new Error(`Unknown transcription option: ${transcriptionOption}`)
    }
    let mdContent = ''
    try {
      mdContent = await readFile(`${finalPath}.md`, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
    const finalContent = `${mdContent}\n## Transcript\n\n${txtContent}`
    await writeFile(`${finalPath}.md`, finalContent)
    console.log(`Markdown file with frontmatter and transcript:\n  - ${finalPath}.md`)
    return finalContent
  } catch (error) {
    console.error('Error in runTranscription:', error)
    throw error
  }
}