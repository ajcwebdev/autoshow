// scripts/transform.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check if an input base name was provided as a command-line argument
if (process.argv.length < 3) {
  console.error('Usage: node transform.js <videoID>')
  process.exit(1)
}

// Get the video ID from the command line arguments
const videoID = process.argv[2]

// Define the paths to the original LRC file and the final Markdown file
const originalPath = path.join(__dirname, '..', 'content', `${videoID}.lrc`)
const finalPath = path.join(__dirname, '..', 'content', `${videoID}.txt`)

// Read the original LRC file
const transformLRCFile = () => {
  fs.readFile(originalPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err)
      return
    }

    // Transform the content
    let tempContent = data
      // Remove the file signature
      .replace(/\[by:whisper\.cpp\]\n/g, '')
      // Format timestamps and remove milliseconds
      .replace(/\[(\d+):(\d{2})(?:\.\d+)?\]/g, '[$1:$2]')
      // Merge lines
      .split('\n')
      .reduce((acc, line, index, array) => {
        if (index % 2 === 0 && index + 1 < array.length) {
          return `${acc}${line} ${array[index + 1].replace(/^\[\d+:\d{2}\] /, '')}\n`
        } else if (index % 2 !== 0) {
          return acc
        } else {
          return `${acc}${line}\n` // Handle the case where there's an odd number of lines
        }
      }, '')

    // Write the final content to a new file
    fs.writeFile(finalPath, tempContent, 'utf8', err => {
      if (err) {
        console.error('Error writing file:', err)
        return
      }
      console.log(`Transformation complete. File saved to: ${finalPath}`)
    })
  })
}

// Execute the transformation function
transformLRCFile()