// server/routes/urls.js

import { processURLs } from '../../../src/commands/processURLs.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /urls route
const handleURLsRequest = async (request, reply) => {
  console.log('\nEntered handleURLsRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('\nParsed request body:', requestData)

    // Extract file path
    const { filePath } = requestData

    if (!filePath) {
      console.log('File path not provided, sending 400')
      reply.status(400).send({ error: 'File path is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)
    console.log('\nCalling processURLs with params:', { filePath, llmServices, transcriptServices, options })

    await processURLs(filePath, llmServices, transcriptServices, options)

    console.log('\nprocessURLs completed successfully')
    reply.send({ message: 'URLs processed successfully.' })
  } catch (error) {
    console.error('Error processing URLs:', error)
    reply.status(500).send({ error: 'An error occurred while processing the URLs' })
  }
}

export { handleURLsRequest }