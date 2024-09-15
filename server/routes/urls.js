// server/routes/urls.js

import { processURLs } from '../../src/commands/processURLs.js'

const handleURLsRequest = async (req, res) => {
  console.log('Entered handleURLsRequest')
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
    console.log('Received chunk:', chunk.toString())
  })
  req.on('end', async () => {
    console.log('Request body complete:', body)
    try {
      const { filePath, model = 'base', llm, options = {} } = JSON.parse(body)
      console.log('Parsed request body:', { filePath, model, llm, options })
      if (!filePath) {
        console.log('File path not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'File path is required' }))
        return
      }
      const llmOpt = llm || null
      await processURLs(filePath, llmOpt, model, options)
      console.log('processURLs completed successfully')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ 
        message: 'URLs processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing URLs:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'An error occurred while processing the URLs' }))
    }
  })
}

export { handleURLsRequest }