// src/utils/runTranscription.js

import { readFile, writeFile } from 'node:fs/promises'
import { callWhisper } from '../transcription/whisper.js'
import { PROMPT } from '../llms/prompt.js'

async function appendFinalContent(finalPath, txtContent, frontMatter) {
  try {
    let mdContent = frontMatter
    try {
      mdContent = await readFile(`${finalPath}.md`, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
    const finalContent = `${mdContent}\n${PROMPT}\n## Transcript\n\n${txtContent}`
    console.log(`Frontmatter, prompt, and transcript concatenated together:\n  - ${finalPath}-with-prompt.md`)
    return finalContent
  } catch (error) {
    console.error('Error concatenating final content:', error)
    throw new Error('Failed to read content from file')
  }
}

export const runTranscription = async (finalPath, whisperModelType, frontMatter = '') => {
  try {
    const txtContent = await callWhisper(finalPath, whisperModelType)
    const finalContent = await appendFinalContent(finalPath, txtContent, frontMatter)
    await writeFile(`${finalPath}-with-prompt.md`, finalContent)
    console.log(`\nMarkdown file with frontmatter, prompt, and transcript:\n  - ${finalPath}-with-prompt.md`)
  } catch (error) {
    console.error('Error in runTranscription:', error)
    if (error.message === 'Transcription process failed' && error.stderr) {
      console.error('Whisper.cpp stderr output:', error.stderr)
    }
    throw error
  }
}