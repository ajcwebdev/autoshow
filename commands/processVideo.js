// commands/processVideo.js

import fs from 'fs'
import youtubedl from 'youtube-dl-exec'
import ffmpegPath from 'ffmpeg-static'
import { exec, execSync } from 'child_process'
import { unlink } from 'fs/promises'
import { formatDate, generateMarkdown, processLrcToTxt, concatenateFinalContent, cleanUpFiles } from '../utils/index.js'
import { callChatGPT, callClaude, callCohere, callMistral, callOcto } from '../utils/llms/index.js'
import { deepgramTranscribe } from '../utils/transcription/deepgram.js'
import { assemblyTranscribe } from '../utils/transcription/assembly.js'

export async function processVideo(url, model, chatgpt, claude, cohere, mistral, octo, deepgram, assembly) {
  try {
    const metadata = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true
    })

    const formattedDate = formatDate(metadata.upload_date)
    const video_id = `content/${metadata.id}`
    const final = `content/${formattedDate}-${metadata.id}`

    const frontMatter = generateMarkdown(metadata)
    const mdContent = `---\n${frontMatter}\n---\n`
    fs.writeFileSync(`${video_id}.md`, mdContent)
    console.log(`\nMarkdown file completed successfully:\n  - ${video_id}.md`)

    // Download and convert audio
    await youtubedl(url, {
      format: 'bestaudio',
      output: `${video_id}.webm`
    })
    console.log(`\nAudio downloaded successfully:\n  - ${video_id}.webm`)

    const wav = `${video_id}.wav`
    const command = `${ffmpegPath} -i ${video_id}.webm -ar 16000 ${wav}`

    exec(command, async error => {
      if (error) {
        console.error(`Error converting to WAV: ${error.message}`)
        return
      }
      console.log(`WAV file completed successfully:\n  - ${wav}`)

      // Ensuring that the conversion is complete before removing the .webm file
      try {
        await unlink(`${video_id}.webm`)
        console.log(`Intermediate webm file removed:\n  - ${video_id}.webm`)
      } catch (unlinkError) {
        console.error('Error removing intermediate webm file:', unlinkError)
      }

      let txtContent
      if (deepgram) {
        await deepgramTranscribe(wav, video_id)
        txtContent = fs.readFileSync(`${video_id}.txt`, 'utf8')
      } else if (assembly) {
        await assemblyTranscribe(wav, video_id)
        txtContent = fs.readFileSync(`${video_id}.txt`, 'utf8')
      } else {
        execSync(`./whisper.cpp/main -m "${model}" -f "${wav}" -of "${video_id}" --output-lrc`, { stdio: 'ignore' })
        console.log(`\nTranscript file completed successfully:\n  - ${video_id}.lrc`)
        txtContent = processLrcToTxt(video_id)
      }

      const finalContent = concatenateFinalContent(video_id, txtContent)
      fs.writeFileSync(`${final}.md`, finalContent)
      console.log(`Prompt concatenated to transformed transcript successfully:\n  - ${final}.md`)

      const llmCalls = {
        chatgpt: callChatGPT,
        claude: callClaude,
        cohere: callCohere,
        mistral: callMistral,
        octo: callOcto
      }

      const llmFlags = { chatgpt, claude, cohere, mistral, octo }

      for (const [llm, callFunction] of Object.entries(llmCalls)) {
        if (llmFlags[llm]) {
          const outputFile = `${final}_${llm}_shownotes.md`
          await callFunction(finalContent, outputFile)
          console.log(`Show notes generated successfully:\n  - ${outputFile}`)
        }
      }

      cleanUpFiles(video_id)
      console.log(`\nProcess completed successfully for URL:\n  - ${url}\n`)
    })
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
  }
}