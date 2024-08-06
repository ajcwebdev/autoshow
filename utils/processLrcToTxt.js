// utils/processLrcToTxt.js

import fs from 'fs'

export function processLrcToTxt(id) {
  const lrcPath = `${id}.lrc`
  const txtPath = `${id}.txt`
  const lrcContent = fs.readFileSync(lrcPath, 'utf8')
  const txtContent = lrcContent.split('\n')
    .filter(line => !line.startsWith('[by:whisper.cpp]'))
    .map(line => line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, match => match.slice(0, -4) + ']'))
    .join('\n')
  fs.writeFileSync(txtPath, txtContent)
  console.log(`Transcript file transformed successfully:\n  - ${id}.txt`)
  return txtContent
}