// src/utils/runLLM.js

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { callChatGPT } from '../llms/chatgpt.js'
import { callClaude } from '../llms/claude.js'
import { callCohere } from '../llms/cohere.js'
import { callMistral } from '../llms/mistral.js'
import { callOcto } from '../llms/octo.js'
import { callLlama } from '../llms/llama.js'
import { PROMPT } from '../llms/prompt.js'

export async function runLLM(finalPath, frontMatter, llmOption) {
  try {
    const transcriptContent = await readFile(`${finalPath}.txt`, 'utf8')
    const llmFunctions = {
      chatgpt: callChatGPT,
      claude: callClaude,
      cohere: callCohere,
      mistral: callMistral,
      octo: callOcto,
      llama: callLlama,
    }
    if (llmOption && llmFunctions[llmOption]) {
      await llmFunctions[llmOption](
        `${PROMPT}\n${transcriptContent}`,
        `${finalPath}-${llmOption}-shownotes.md`
      )
      const generatedShowNotes = await readFile(`${finalPath}-${llmOption}-shownotes.md`, 'utf8')
      const finalContent = `${frontMatter}\n${generatedShowNotes}\n\n## Transcript\n\n${transcriptContent}`
      await writeFile(`${finalPath}-${llmOption}-shownotes.md`, finalContent)
      console.log(`Updated markdown file with generated show notes:\n  - ${finalPath}-${llmOption}-shownotes.md`)
      try {
        await unlink(`${finalPath}.md`)
        console.log(`Temporary file removed:\n  - ${finalPath}.md`)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error removing temporary file:', error)
        }
      }
    } else {
      const finalContent = `${frontMatter}\n${PROMPT}\n## Transcript\n\n${transcriptContent}`
      await writeFile(`${finalPath}-with-prompt.md`, finalContent)
      console.log(`No LLM specified. Created markdown file with original structure:\n  - ${finalPath}-with-prompt.md`)
    }
  } catch (error) {
    console.error('Error running LLM:', error)
    throw error
  }
}