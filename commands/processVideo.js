// commands/processVideo.js

import fs from 'fs'
import youtubedl from 'youtube-dl-exec'
import ffmpegPath from 'ffmpeg-static'
import { exec, execSync } from 'child_process'
import { unlink } from 'fs/promises'
import { generateMarkdown, processLrcToTxt, concatenateFinalContent, cleanUpFiles } from '../utils/index.js'
import { callChatGPT, callClaude, callCohere, callMistral, callOcto } from '../utils/llms/index.js'
import { deepgramTranscribe } from '../utils/transcription/deepgram.js'
import { assemblyTranscribe } from '../utils/transcription/assembly.js'

export async function processVideo(url, model, chatgpt, claude, cohere, mistral, octo, deepgram, assembly, docker) {
  try {
    // Create the initial markdown file with frontmatter
    const { frontMatter, finalPath } = await generateMarkdown(url, {})
    fs.writeFileSync(`${finalPath}.md`, frontMatter)
    console.log(`\nMarkdown file completed successfully:\n  - ${finalPath}.md`)

    // Download and convert audio
    await youtubedl(url, {
      format: 'bestaudio',
      output: `${finalPath}.webm`
    })
    console.log(`\nAudio downloaded successfully:\n  - ${finalPath}.webm`)

    const command = `${ffmpegPath} -i ${finalPath}.webm -ar 16000 ${finalPath}.wav`

    return new Promise((resolve, reject) => {
      exec(command, async (error) => {
        if (error) {
          console.error(`Error converting to WAV: ${error.message}`)
          reject(error)
          return
        }
        console.log(`WAV file completed successfully:\n  - ${finalPath}.wav`)

        // Ensuring that the conversion is complete before removing the .webm file
        try {
          await unlink(`${finalPath}.webm`)
          console.log(`Intermediate webm file removed:\n  - ${finalPath}.webm`)
        } catch (unlinkError) {
          console.error('Error removing intermediate webm file:', unlinkError)
        }

        let txtContent
        if (deepgram) {
          await deepgramTranscribe(`${finalPath}.wav`, finalPath)
          txtContent = fs.readFileSync(`${finalPath}.txt`, 'utf8')
        } else if (assembly) {
          await assemblyTranscribe(`${finalPath}.wav`, finalPath)
          txtContent = fs.readFileSync(`${finalPath}.txt`, 'utf8')
        } else if (docker) {
          execSync(`docker run --rm -v ${process.cwd()}:/app/workspace whisper-image "/app/main -m /app/models/${model} -f /app/workspace/${finalPath}.wav -of /app/workspace/${finalPath} --output-lrc"`)
          console.log(`\nTranscript file completed successfully:\n  - ${finalPath}.lrc`)
          txtContent = processLrcToTxt(finalPath)
        } else {
          execSync(`./whisper.cpp/main -m "whisper.cpp/models/${model}" -f "${finalPath}.wav" -of "${finalPath}" --output-lrc`, { stdio: 'ignore' })
          console.log(`\nTranscript file completed successfully:\n  - ${finalPath}.lrc`)
          txtContent = processLrcToTxt(finalPath)
        }

        // Concatenate prompt and write the final markdown file
        const finalContent = concatenateFinalContent(finalPath, txtContent)
        fs.writeFileSync(`${finalPath}.md`, finalContent)
        console.log(`Prompt concatenated to transformed transcript successfully:\n  - ${finalPath}.md`)

        const llmCalls = {
          chatgpt: callChatGPT,
          claude: callClaude,
          cohere: callCohere,
          mistral: callMistral,
          octo: callOcto
          // llama: callLlama,
          // ollama: callOllama
        }

        const llmFlags = { chatgpt, claude, cohere, mistral, octo }

        for (const [llm, callFunction] of Object.entries(llmCalls)) {
          if (llmFlags[llm]) {
            const outputFile = `${finalPath}_${llm}_shownotes.md`
            await callFunction(finalContent, outputFile)
            console.log(`Show notes generated successfully:\n  - ${outputFile}`)
          }
        }

        cleanUpFiles(finalPath)
        console.log(`\nProcess completed successfully for URL:\n  - ${url}\n`)
        resolve(finalContent) // Return the final content
      })
    })
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
    throw error // Ensure errors are propagated
  }
}