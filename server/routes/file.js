// server/file.js

import { processFile } from '../../src/commands/processFile.js'

const handleFileRequest = async (req, res) => {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', async () => {
    try {
      const { filePath, model = 'base', llm } = JSON.parse(body)
      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'File path is required' }))
        return
      }
      const llmOption = llm || null
      await processFile(filePath, llmOption, model)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'File processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing file:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the file' }))
    }
  })
}

export { handleFileRequest }