// src/utils/runLLM.js

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { callChatGPT } from '../llms/chatgpt.js'
import { callClaude } from '../llms/claude.js'
import { callCohere } from '../llms/cohere.js'
import { callMistral } from '../llms/mistral.js'
import { callOcto } from '../llms/octo.js'
import { callLlama } from '../llms/llama.js'
// import { callLlamaCpp } from '../llms/llamacpp.js'
import { callGemini } from '../llms/gemini.js'
import { generatePrompt } from '../llms/prompt.js'

export async function runLLM(finalPath, frontMatter, llmOption, options) {
  try {
    const transcriptContent = await readFile(`${finalPath}.txt`, 'utf8')
    const llmFunctions = {
      chatgpt: callChatGPT,
      claude: callClaude,
      cohere: callCohere,
      mistral: callMistral,
      octo: callOcto,
      llama: callLlama,
      // llamacpp: callLlamaCpp,
      gemini: callGemini,
    }
    const promptSections = options.prompt || ['summary', 'longChapters']
    const fullPrompt = generatePrompt(promptSections)
    const promptAndTranscript = `${fullPrompt}\n${transcriptContent}`
    if (llmOption && llmFunctions[llmOption]) {
      const tempOutputPath = `${finalPath}-${llmOption}-temp-shownotes.md`
      await llmFunctions[llmOption](
        promptAndTranscript,
        tempOutputPath,
        options[llmOption] || undefined
      )
      const generatedShowNotes = await readFile(tempOutputPath, 'utf8')
      const finalContent = `${frontMatter}\n${generatedShowNotes}\n\n## Transcript\n\n${transcriptContent}`
      const finalOutputPath = `${finalPath}-${llmOption}-shownotes.md`
      await writeFile(finalOutputPath, finalContent)
      await unlink(tempOutputPath)
      console.log(`Updated markdown file with generated show notes:\n  - ${finalOutputPath}`)
    } else {
      const finalContent = `${frontMatter}\n${fullPrompt}## Transcript\n\n${transcriptContent}`
      await writeFile(`${finalPath}-prompt.md`, finalContent)
      console.log(`\nNo LLM specified. Created markdown file with original structure:\n  - ${finalPath}-prompt.md\n`)
    }
  } catch (error) {
    console.error('Error running LLM:', error)
    throw error
  }
}