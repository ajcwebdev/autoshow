// commands/processVideo.js

import fs from 'fs'
import youtubedl from 'youtube-dl-exec'
import ffmpegPath from 'ffmpeg-static'
import { exec, execSync } from 'child_process'
import { unlink } from 'fs/promises'
import { formatDate, generateMarkdown, processLrcToTxt, concatenateFinalContent, cleanUpFiles } from '../utils/index.js'
import { callChatGPT, callClaude } from '../utils/llms.js'
import { deepgramTranscribe } from '../utils/transcription/deepgram.js'
import { assemblyTranscribe } from '../utils/transcription/assembly.js'

export async function processVideo(url, model, chatgpt, claude, deepgram, assembly) {
  try {
    const metadata = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true
    })

    const id = `content/${metadata.id}`
    const formattedDate = formatDate(metadata.upload_date) // Use formatted date for filename
    const final = `content/${formattedDate}-${metadata.id}`
    const mdContent = generateMarkdown(metadata)
    fs.writeFileSync(`${id}.md`, mdContent)
    console.log(`Markdown file completed successfully: ${id}.md`)

    // Download and convert audio
    await youtubedl(url, {
      format: 'bestaudio',
      output: `${id}.webm`
    })
    console.log(`Audio downloaded successfully: ${id}.webm`)

    const wavFilePath = `${id}.wav`
    const command = `${ffmpegPath} -i ${id}.webm -ar 16000 ${wavFilePath}`

    exec(command, async error => {
      if (error) {
        console.error(`Error converting to WAV: ${error.message}`)
        return
      }
      console.log(`WAV file completed successfully: ${wavFilePath}`)

      // Ensuring that the conversion is complete before removing the .webm file
      try {
        await unlink(`${id}.webm`)
        console.log(`Intermediate webm file removed: ${id}.webm`)
      } catch (unlinkError) {
        console.error('Error removing intermediate webm file:', unlinkError)
      }

      let txtContent
      if (deepgram) {
        await deepgramTranscribe(wavFilePath, id)
        txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
      } else if (assembly) {
        await assemblyTranscribe(wavFilePath, id)
        txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
      } else {
        execSync(`./whisper.cpp/main -m "${model}" -f "${wavFilePath}" -of "${id}" --output-lrc`, { stdio: 'ignore' })
        console.log(`Transcript file completed successfully: ${id}.lrc`)
        txtContent = processLrcToTxt(id)
      }

      const finalContent = concatenateFinalContent(id, txtContent)
      fs.writeFileSync(`${final}.md`, finalContent)
      console.log(`Prompt concatenated to transformed transcript successfully: ${final}.md`)

      if (chatgpt) {
        await callChatGPT(finalContent, `${final}_chatgpt_shownotes.md`)
        console.log(`ChatGPT show notes generated successfully: ${final}_chatgpt_shownotes.md`)
      }

      if (claude) {
        await callClaude(finalContent, `${final}_claude_shownotes.md`)
        console.log(`Claude show notes generated successfully: ${final}_claude_shownotes.md`)
      }

      cleanUpFiles(id)
      console.log(`Process completed successfully for URL: ${url}`)
    })
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
  }
}