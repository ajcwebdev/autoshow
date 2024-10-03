// server/routes/rss.js

import { processRSS } from '../../src/commands/processRSS.js'
import { mapRequestDataToOptions } from '../utils/mapRequestDataToOptions.js'

const handleRSSRequest = async (req, res) => {
  console.log('Entered handleRSSRequest')
  let body = ''
  req.on('data', (chunk) => {
    body += chunk.toString()
    console.log('Received chunk:', chunk.toString())
  })
  req.on('end', async () => {
    console.log('Request body complete:', body)
    try {
      const requestData = JSON.parse(body)
      console.log('Parsed request body:', requestData)

      const { rssUrl } = requestData

      if (!rssUrl) {
        console.log('RSS URL not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'RSS URL is required' }))
        return
      }

      const { options, llmOpt, transcriptOpt } = mapRequestDataToOptions(requestData)

      console.log('Calling processRSS with params:', { rssUrl, llmOpt, transcriptOpt, options })

      await processRSS(rssUrl, llmOpt, transcriptOpt, options)

      console.log('processRSS completed successfully')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          message: 'RSS feed processed successfully.',
        })
      )
    } catch (error) {
      console.error('Error processing RSS request:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'An error occurred while processing the RSS feed' }))
    }
  })
}

export { handleRSSRequest }