// src/server/routes/rss.ts

import type { FastifyRequest, FastifyReply } from 'fastify'
import { processRSS } from '../../commands/process-rss'
import { reqToOpts } from '../utils/reqToOpts'
import { l, err } from '../../../src/utils/logging'

// Handler for the /rss route
export const handleRSSRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handleRSSRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    l('\nParsed request body:', requestData)

    // Extract RSS URL from the request data
    const { rssUrl } = requestData

    if (!rssUrl) {
      l('RSS URL not provided, sending 400')
      reply.status(400).send({ error: 'RSS URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.rss to rssUrl
    options.rss = rssUrl

    l('\nCalling processRSS with params:', {
      rssUrl,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processRSS with the mapped options and extracted RSS URL
    await processRSS(options, rssUrl, llmServices, transcriptServices)

    l('\nprocessRSS completed successfully')
    reply.send({ message: 'RSS feed processed successfully.' })
  } catch (error) {
    err('Error processing RSS request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the RSS feed' })
  }
}