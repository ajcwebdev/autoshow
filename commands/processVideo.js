// commands/processVideo.js

import { execSync } from 'child_process'
import fs from 'fs'
import { ytAlias, processLrcToTxt, concatenateFinalContent, cleanUpFiles, callChatGPT, callClaude } from '../utils/index.js'
import { transcribe as deepgramTranscribe } from '../transcription/deepgram.js'
import { transcribe as assemblyTranscribe } from '../transcription/assembly.js'

export async function processVideo(url, model, chatgpt, claude, deepgram, assembly) {
  try {
    const videoId = execSync(`${ytAlias} --print id "${url}"`).toString().trim()
    const uploadDate = execSync(`${ytAlias} --print filename -o "%(upload_date>%Y-%m-%d)s" "${url}"`).toString().trim()
    const id = `content/${videoId}`
    const final = `content/${uploadDate}-${videoId}`

    const mdContent = [
      "---",
      `showLink: "${execSync(`${ytAlias} --print webpage_url "${url}"`).toString().trim()}"`,
      `channel: "${execSync(`${ytAlias} --print uploader "${url}"`).toString().trim()}"`,
      `channelURL: "${execSync(`${ytAlias} --print uploader_url "${url}"`).toString().trim()}"`,
      `title: "${execSync(`${ytAlias} --print title "${url}"`).toString().trim()}"`,
      `publishDate: "${uploadDate}"`,
      `coverImage: "${execSync(`${ytAlias} --print thumbnail "${url}"}`).toString().trim()}"`,
      "---\n"
    ].join('\n')

    fs.writeFileSync(`${id}.md`, mdContent)
    console.log(`Markdown file completed successfully: ${id}.md`)

    execSync(`${ytAlias} -x --audio-format wav --postprocessor-args "ffmpeg: -ar 16000" -o "${id}.wav" "${url}"`)
    console.log(`WAV file completed successfully: ${id}.wav`)

    let txtContent
    if (deepgram) {
      await deepgramTranscribe(`${id}.wav`, id)
      txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
    } else if (assembly) {
      await assemblyTranscribe(`${id}.wav`, id)
      txtContent = fs.readFileSync(`${id}.txt`, 'utf8')
    } else {
      execSync(`./whisper.cpp/main -m "${model}" -f "${id}.wav" -of "${id}" --output-lrc`)
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
  } catch (error) {
    console.error(`Error processing video: ${url}`, error)
  }
}