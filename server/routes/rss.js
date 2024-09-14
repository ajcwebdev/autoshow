// server/routes/rss.js

import { processRSS } from '../../src/commands/processRSS.js'

const handleRSSRequest = async (req, res) => {
  console.log('Entered handleRSSRequest')
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
    console.log('Received chunk:', chunk.toString())
  })
  req.on('end', async () => {
    console.log('Request body complete:', body)
    try {
      const { rssUrl, model = 'base', llm, order = 'newest', skip = 0, options = {} } = JSON.parse(body)
      console.log('Parsed request body:', { rssUrl, model, llm, order, skip, options })

      if (!rssUrl) {
        console.log('RSS URL not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'RSS URL is required' }))
        return
      }

      const llmOption = llm || null
      const whisperModel = model || 'base'
      
      console.log('Starting processRSS in background')
      // Start processing in the background
      processRSS(rssUrl, llmOption, whisperModel, order, skip, options)
        .then(() => console.log('RSS processing completed successfully'))
        .catch(error => console.error('Error during RSS processing:', error))

      // Respond immediately
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ 
        message: 'RSS processing started successfully. This may take some time to complete.'
      }))
    } catch (error) {
      console.error('Error processing RSS request:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'An error occurred while processing the RSS feed' }))
    }
  })
}

export { handleRSSRequest }