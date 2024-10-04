// server/routes/rss.js

import { processRSS } from '../../../src/commands/processRSS.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /rss route
const handleRSSRequest = async (request, reply) => {
  console.log('\nEntered handleRSSRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('\nParsed request body:', requestData)

    // Extract RSS URL
    const { rssUrl } = requestData

    if (!rssUrl) {
      console.log('RSS URL not provided, sending 400')
      reply.status(400).send({ error: 'RSS URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)
    console.log('\nCalling processRSS with params:', { rssUrl, llmServices, transcriptServices, options })

    await processRSS(rssUrl, llmServices, transcriptServices, options)

    console.log('\nprocessRSS completed successfully')
    reply.send({ message: 'RSS feed processed successfully.' })
  } catch (error) {
    console.error('Error processing RSS request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the RSS feed' })
  }
}

export { handleRSSRequest }