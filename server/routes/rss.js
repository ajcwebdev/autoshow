// server/routes/rss.js

import { processRSS } from '../../src/commands/processRSS.js' // Import processRSS function
import { reqToOpts } from '../utils/reqToOpts.js' // Import utility function

// Handler for /rss route
const handleRSSRequest = async (request, reply) => {
  console.log('Entered handleRSSRequest')

  try {
    const requestData = request.body // Access parsed request body
    console.log('Parsed request body:', requestData)

    const { rssUrl } = requestData // Extract RSS URL

    if (!rssUrl) {
      console.log('RSS URL not provided, sending 400')
      reply.status(400).send({ error: 'RSS URL is required' }) // Send 400 Bad Request
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processRSS with params:', { rssUrl, llmOpt, transcriptOpt, options })

    await processRSS(rssUrl, llmOpt, transcriptOpt, options) // Process the RSS feed

    console.log('processRSS completed successfully')
    reply.send({ message: 'RSS feed processed successfully.' }) // Send success response
  } catch (error) {
    console.error('Error processing RSS request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the RSS feed' }) // Send 500 Internal Server Error
  }
}

export { handleRSSRequest } // Export the handler function