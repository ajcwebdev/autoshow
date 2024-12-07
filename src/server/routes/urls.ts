// src/server/routes/urls.ts

import type { FastifyRequest, FastifyReply } from 'fastify'
import { processURLs } from '../../commands/process-urls'
import { reqToOpts } from '../utils/reqToOpts'
import { l, err } from '../../../src/utils/logging'

// Handler for the /urls route
export const handleURLsRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handleURLsRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    l('\nParsed request body:', requestData)

    // Extract file path from the request data
    const { filePath } = requestData

    if (!filePath) {
      l('File path not provided, sending 400')
      reply.status(400).send({ error: 'File path is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.urls to filePath
    options.urls = filePath

    l('\nCalling processURLs with params:', {
      filePath,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processURLs with the mapped options and extracted file path
    await processURLs(options, filePath, llmServices, transcriptServices)

    l('\nprocessURLs completed successfully')
    reply.send({ message: 'URLs processed successfully.' })
  } catch (error) {
    err('Error processing URLs:', error)
    reply.status(500).send({ error: 'An error occurred while processing the URLs' })
  }
}