// src/commands/processFile.js

import fs from 'fs'
import path from 'path'
import ffmpegPath from 'ffmpeg-static'
import { exec, execSync } from 'child_process'
import { processLrcToTxt, concatenateFinalContent, cleanUpFiles } from '../utils/exports.js'
import { callChatGPT, callClaude, callCohere, callMistral, callOcto } from '../llms/index.js'
import { deepgramTranscribe } from '../transcription/deepgram.js'
import { assemblyTranscribe } from '../transcription/assembly.js'

export async function processFile(filePath, model, chatgpt, claude, cohere, mistral, octo, deepgram, assembly) {
  try {
    const fileName = path.basename(filePath, path.extname(filePath))
    const id = `content/${fileName}`
    const final = `content/${fileName}`

    // Generate basic metadata
    const mdContent = [
      "---",
      `showLink: "${filePath}"`,
      `channel: ""`,
      `channelURL: ""`,
      `title: "${fileName}"`,
      `description: ""`,
      `publishDate: ""`,
      `coverImage: ""`,
      "---\n"
    ].join('\n')
    fs.writeFileSync(`${id}.md`, mdContent)
    console.log(`\nMetadata file created successfully:\n  - ${id}.md`)

    // Convert audio to WAV format
    const wavFilePath = `${id}.wav`
    const command = `${ffmpegPath} -i "${filePath}" -ar 16000 "${wavFilePath}"`

    exec(command, async error => {
      if (error) {
        console.error(`Error converting to WAV: ${error.message}`)
        return
      }
      console.log(`WAV file completed successfully:\n  - ${wavFilePath}`)

      let txtContent
      if (deepgram) {
        await deepgramTranscribe(wavFilePath, id)
        txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
      } else if (assembly) {
        await assemblyTranscribe(wavFilePath, id)
        txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
      } else {
        execSync(`./whisper.cpp/main -m "whisper.cpp/models/${model}" -f "${wavFilePath}" -of "${id}" --output-lrc`, { stdio: 'ignore' })
        console.log(`\nTranscript file completed successfully:\n  - ${id}.lrc`)
        txtContent = processLrcToTxt(id)
      }

      const finalContent = concatenateFinalContent(id, txtContent)
      fs.writeFileSync(`${final}-final.md`, finalContent)
      console.log(`Prompt concatenated to transformed transcript successfully:\n  - ${final}-final.md`)

      if (chatgpt) {
        await callChatGPT(finalContent, `${final}_chatgpt_shownotes.md`)
        console.log(`ChatGPT show notes generated successfully:\n  - ${final}_chatgpt_shownotes.md`)
      }

      if (claude) {
        await callClaude(finalContent, `${final}_claude_shownotes.md`)
        console.log(`Claude show notes generated successfully:\n  - ${final}_claude_shownotes.md`)
      }

      if (cohere) {
        await callCohere(finalContent, `${final}_cohere_shownotes.md`)
        console.log(`Cohere show notes generated successfully:\n  - ${final}_cohere_shownotes.md`)
      }

      if (mistral) {
        await callMistral(finalContent, `${final}_mistral_shownotes.md`)
        console.log(`Mistral show notes generated successfully:\n  - ${final}_mistral_shownotes.md`)
      }

      if (octo) {
        await callOcto(finalContent, `${final}_octo_shownotes.md`)
        console.log(`Octo show notes generated successfully:\n  - ${final}_octo_shownotes.md`)
      }

      cleanUpFiles(id)
      console.log(`\n\nProcess completed successfully for file: ${filePath}\n`)
    })
  } catch (error) {
    console.error(`Error processing audio file: ${filePath}`, error)
  }
}