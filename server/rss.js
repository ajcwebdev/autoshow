// server/rss.js

import { processRSS } from '../src/commands/processRSS.js'

const handleRSSRequest = async (req, res) => {
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  req.on('end', async () => {
    try {
      const { rssUrl, model = 'base', llm, order = 'newest', skip = 0 } = JSON.parse(body)
      if (!rssUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'RSS URL is required' }))
        return
      }
      const llmOption = llm || null
      const whisperModelType = model || 'base'
      
      // Start processing in the background
      processRSS(rssUrl, llmOption, whisperModelType, order, skip)
        .then(() => console.log('RSS processing completed successfully'))
        .catch(error => console.error('Error during RSS processing:', error))

      // Respond immediately
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'RSS processing started successfully. This may take some time to complete.'
      }))
    } catch (error) {
      console.error('Error processing RSS request:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the RSS feed' }))
    }
  })
}

export { handleRSSRequest }