// src/utils/runLLM.js

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { callChatGPT } from '../llms/chatgpt.js'
import { callClaude } from '../llms/claude.js'
import { callCohere } from '../llms/cohere.js'
import { callMistral } from '../llms/mistral.js'
import { callOcto } from '../llms/octo.js'
import { callLlama } from '../llms/llama.js'
import { callGemini } from '../llms/gemini.js'
import { generatePrompt } from '../llms/prompt.js'

export async function runLLM(finalPath, frontMatter, llmOption, options) {
  try {
    console.log('\nOptions received in runLLM:\n')
    console.log(options)
    const transcriptContent = await readFile(`${finalPath}.txt`, 'utf8')
    const llmFunctions = {
      chatgpt: callChatGPT,
      claude: callClaude,
      cohere: callCohere,
      mistral: callMistral,
      octo: callOcto,
      llama: callLlama,
      gemini: callGemini,
    }
    const promptSections = options.prompt || ['summary', 'longChapters']
    const prompt = generatePrompt(promptSections)
    const fullPrompt = `${prompt}\n${transcriptContent}`
    if (llmOption && llmFunctions[llmOption]) {
      const tempOutputPath = `${finalPath}-${llmOption}-temp-shownotes.md`
      await llmFunctions[llmOption](
        fullPrompt,
        tempOutputPath,
        options[llmOption] || undefined
      )
      const generatedShowNotes = await readFile(tempOutputPath, 'utf8')
      const finalContent = `${frontMatter}\n${generatedShowNotes}\n\n## Transcript\n\n${transcriptContent}`
      const finalOutputPath = `${finalPath}-${llmOption}-shownotes.md`
      await writeFile(finalOutputPath, finalContent)
      await unlink(tempOutputPath)
      console.log(`\nUpdated markdown file with generated show notes:\n  - ${finalOutputPath}`)
    } else {
      const finalContent = `${frontMatter}\n${prompt}## Transcript\n\n${transcriptContent}`
      await writeFile(`${finalPath}-prompt.md`, finalContent)
      console.log(`\nNo LLM specified. Created markdown file with original structure:\n  - ${finalPath}-prompt.md`)
    }
    try {
      await unlink(`${finalPath}.md`)
      console.log(`Temporary file removed:\n  - ${finalPath}.md`)
      await unlink(`${finalPath}.txt`)
      console.log(`Temporary file removed:\n  - ${finalPath}.txt\n`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error removing temporary file:', error)
      }
    }
  } catch (error) {
    console.error('Error running LLM:', error)
    throw error
  }
}