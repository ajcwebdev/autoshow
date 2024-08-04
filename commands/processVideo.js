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
    const metadata = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true
    })

    const formattedDate = metadata.upload_date.length === 8
      ? metadata.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
      : metadata.upload_date

    const videoId = `content/${metadata.id}`
    const final = `content/${formattedDate}-${metadata.id}`

    const frontMatter = generateMarkdown(metadata)
    const mdContent = `${frontMatter}`
    fs.writeFileSync(`${videoId}.md`, mdContent)
    console.log(`\nMarkdown file completed successfully:\n  - ${videoId}.md`)

    // Download and convert audio
    await youtubedl(url, {
      format: 'bestaudio',
      output: `${videoId}.webm`
    })
    console.log(`\nAudio downloaded successfully:\n  - ${videoId}.webm`)

    const wav = `${videoId}.wav`
    const command = `${ffmpegPath} -i ${videoId}.webm -ar 16000 ${wav}`

    return new Promise((resolve, reject) => {
      exec(command, async (error) => {
        if (error) {
          console.error(`Error converting to WAV: ${error.message}`)
          reject(error)
          return
        }
        console.log(`WAV file completed successfully:\n  - ${wav}`)

        // Ensuring that the conversion is complete before removing the .webm file
        try {
          await unlink(`${videoId}.webm`)
          console.log(`Intermediate webm file removed:\n  - ${videoId}.webm`)
        } catch (unlinkError) {
          console.error('Error removing intermediate webm file:', unlinkError)
        }

        let txtContent
        if (deepgram) {
          await deepgramTranscribe(wav, videoId)
          txtContent = fs.readFileSync(`${videoId}.txt`, 'utf8')
        } else if (assembly) {
          await assemblyTranscribe(wav, videoId)
          txtContent = fs.readFileSync(`${videoId}.txt`, 'utf8')
        } else if (docker) {
          execSync(`docker run --rm -v ${process.cwd()}:/app/workspace whisper-image "/app/main -m /app/models/${model} -f /app/workspace/${wav} -of /app/workspace/${videoId} --output-lrc"`)
          console.log(`\nTranscript file completed successfully:\n  - ${videoId}.lrc`)
          txtContent = processLrcToTxt(videoId)
        } else {
          execSync(`./whisper.cpp/main -m "whisper.cpp/models/${model}" -f "${wav}" -of "${videoId}" --output-lrc`, { stdio: 'ignore' })
          console.log(`\nTranscript file completed successfully:\n  - ${videoId}.lrc`)
          txtContent = processLrcToTxt(videoId)
        }

        const finalContent = concatenateFinalContent(videoId, txtContent)
        fs.writeFileSync(`${final}.md`, finalContent)
        console.log(`Prompt concatenated to transformed transcript successfully:\n  - ${final}.md`)

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
            const outputFile = `${final}_${llm}_shownotes.md`
            await callFunction(finalContent, outputFile)
            console.log(`Show notes generated successfully:\n  - ${outputFile}`)
          }
        }

        cleanUpFiles(videoId)
        console.log(`\nProcess completed successfully for URL:\n  - ${url}\n`)
        resolve(finalContent) // Return the final content
      })
    })
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
    throw error // Ensure errors are propagated
  }
}