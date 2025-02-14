#!/usr/bin/env node

// src/utils/scripts/create-clips.ts

/**
 * Usage:
 *    tsx src/utils/scripts/create-clips.ts <markdown_file> <video_file>
 *
 * Example:
 *    tsx src/utils/scripts/create-clips.ts content/2021-05-10-thoughts-on-lambda-school-layoffs-chatgpt-shownotes.md content/2021-05-10-thoughts-on-lambda-school-layoffs.wav
 */

import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'

// Check for correct number of arguments
if (process.argv.length !== 4) {
  console.error(`Usage: ${process.argv[1]} <markdown_file> <video_file>`)
  process.exit(1)
}

// Input arguments
const markdownFile = process.argv[2]!
const videoFile = process.argv[3]!

// Arrays to hold timestamps and titles
const timestamps: string[] = []
const titles: string[] = []

// Regex to match lines of the form: ### 00:00 - Title
const lineRegex = /^###\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.*)$/

// Read the markdown file line by line
const lines = fs.readFileSync(markdownFile, 'utf-8').split('\n')
for (const line of lines) {
  const match = line.match(lineRegex)
  if (match) {
    const timestamp = match[1]!
    const title = match[2]!
    timestamps.push(timestamp)
    titles.push(title)
  }
}

// Check if we have any chapters
if (timestamps.length === 0) {
  console.error(`No chapters found in ${markdownFile}`)
  process.exit(1)
}

// Derive directory name from markdown file
const baseName = path.basename(markdownFile, path.extname(markdownFile))
const sanitizedBaseName = sanitizeTitle(baseName)
const directoryPath = `content/${sanitizedBaseName}`
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true })
}

/**
 * Executes a shell command and returns the stdout and stderr as an object
 * @param {string} cmd The shell command to execute
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
function execPromise(cmd: string): Promise<{ stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr })
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

/**
 * Gets total duration of the video in seconds using ffprobe
 * @param {string} video Path to the video file
 * @returns {Promise<number>}
 */
async function getTotalDurationSeconds(video: string): Promise<number> {
  try {
    const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${video}"`
    const { stdout } = await execPromise(ffprobeCmd)
    const duration = parseFloat(stdout.trim())
    if (isNaN(duration)) {
      console.error(`Could not parse ffprobe output for duration: ${stdout}`)
      process.exit(1)
    }
    return Math.round(duration)
  } catch (err: any) {
    console.error(`Error running ffprobe: ${err.error?.message || err}`)
    process.exit(1)
  }
}

const totalDurationSeconds = await getTotalDurationSeconds(videoFile)

/**
 * Converts a timestamp string (hh:mm:ss or mm:ss) into total seconds
 * @param {string} timeStr The timestamp to convert
 * @returns {number} The total seconds
 */
function timestampToSeconds(timeStr: string): number {
  const parts = timeStr.split(':')
  let h: string = '0', m: string = '0', s: string = '0'
  if (parts.length === 3) {
    h = parts[0]!
    m = parts[1]!
    s = parts[2]!
  } else if (parts.length === 2) {
    m = parts[0]!
    s = parts[1]!
  } else {
    console.error(`Invalid time format: ${timeStr}`)
    process.exit(1)
  }
  return (parseInt(h, 10) * 3600) + (parseInt(m, 10) * 60) + parseInt(s, 10)
}

/**
 * Sanitizes a title string for use in a filename
 * @param {string} str The title string
 * @returns {string} The sanitized filename
 */
function sanitizeTitle(str: string): string {
  let s = str.toLowerCase()
  s = s.replace(/[^a-z0-9]+/g, '-')
  s = s.replace(/-+/g, '-')
  s = s.replace(/^-|-$/g, '')
  return s
}

// Loop over chapters
for (let i = 0; i < timestamps.length; i++) {
  const startTime = timestamps[i]!
  const title = titles[i]!
  const sanitizedTitle = sanitizeTitle(title)

  const startSeconds = timestampToSeconds(startTime)
  let endSeconds
  if (i < timestamps.length - 1) {
    endSeconds = timestampToSeconds(timestamps[i + 1]!)
  } else {
    endSeconds = totalDurationSeconds
  }

  const durationSeconds = endSeconds - startSeconds
  if (durationSeconds <= 0) {
    console.error(`Invalid duration for clip: "${title}"`)
    continue
  }

  const outputFile = `${i}-${sanitizedTitle}.mp4`
  console.log(
    `Extracting clip: ${outputFile} (Start: ${startTime}, Duration: ${durationSeconds} seconds)`
  )

  try {
    const ffmpegCmd = `ffmpeg -y -ss ${startTime} -i "${videoFile}" -t ${durationSeconds} -c copy "${directoryPath}/${outputFile}"`
    await execPromise(ffmpegCmd)
  } catch (err: any) {
    console.error(`Error running ffmpeg for clip "${title}": ${err.error?.message || err}`)
  }
}