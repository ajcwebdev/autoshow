// server/routes/rss.js

import { processRSS } from '../../src/commands/processRSS.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /rss route
const handleRSSRequest = async (request, reply) => {
  console.log('Entered handleRSSRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('Parsed request body:', requestData)

    // Extract RSS URL
    const { rssUrl } = requestData

    if (!rssUrl) {
      console.log('RSS URL not provided, sending 400')
      reply.status(400).send({ error: 'RSS URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processRSS with params:', { rssUrl, llmOpt, transcriptOpt, options })

    await processRSS(rssUrl, llmOpt, transcriptOpt, options)

    console.log('processRSS completed successfully')
    reply.send({ message: 'RSS feed processed successfully.' })
  } catch (error) {
    console.error('Error processing RSS request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the RSS feed' })
  }
}

export { handleRSSRequest }