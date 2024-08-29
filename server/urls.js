// server/urls.js

import { processURLs } from '../src/commands/processURLs.js'

const handleURLsRequest = async (req, res) => {
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
      await processURLs(filePath, llmOption, model)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'URLs processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing URLs:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the URLs' }))
    }
  })
}

export { handleURLsRequest }