// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { PROMPT } from '../llms/prompt.js'

export async function runTranscription(finalPath, whisperModelType, frontMatter = '') {
  try {
    const txtContent = await callWhisper(finalPath, whisperModelType)
    let mdContent = frontMatter
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
      console.error('Whisper.cpp stderr output:', error.stderr)
    }
    throw error
  }
}