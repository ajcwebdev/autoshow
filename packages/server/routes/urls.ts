// server/routes/urls.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { processURLs } from '../../../src/commands/processURLs.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for the /urls route
export const handleURLsRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  console.log('\nEntered handleURLsRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    console.log('\nParsed request body:', requestData)

    // Extract file path from the request data
    const { filePath } = requestData

    if (!filePath) {
      console.log('File path not provided, sending 400')
      reply.status(400).send({ error: 'File path is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.urls to filePath
    options.urls = filePath

    console.log('\nCalling processURLs with params:', {
      filePath,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processURLs with the mapped options and extracted file path
    await processURLs(options, filePath, llmServices, transcriptServices)

    console.log('\nprocessURLs completed successfully')
    reply.send({ message: 'URLs processed successfully.' })
  } catch (error) {
    console.error('Error processing URLs:', error)
    reply.status(500).send({ error: 'An error occurred while processing the URLs' })
  }
}