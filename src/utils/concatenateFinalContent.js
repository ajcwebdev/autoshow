// src/utils/concatenateFinalContent.js

import fs from 'fs'

export function concatenateFinalContent(id, txtContent) {
  return [
    fs.readFileSync(`${id}.md`, 'utf8'),
    fs.readFileSync(`./src/utils/prompt.md`, 'utf8'),
    txtContent
  ].join('\n')
}