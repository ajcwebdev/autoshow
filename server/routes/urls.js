// server/routes/urls.js

import { processURLs } from '../../src/commands/processURLs.js' // Import processURLs function
import { reqToOpts } from '../utils/reqToOpts.js' // Import utility function

// Handler for /urls route
const handleURLsRequest = async (request, reply) => {
  console.log('Entered handleURLsRequest')

  try {
    const requestData = request.body // Access parsed request body
    console.log('Parsed request body:', requestData)

    const { filePath } = requestData // Extract file path

    if (!filePath) {
      console.log('File path not provided, sending 400')
      reply.status(400).send({ error: 'File path is required' }) // Send 400 Bad Request
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processURLs with params:', { filePath, llmOpt, transcriptOpt, options })

    await processURLs(filePath, llmOpt, transcriptOpt, options) // Process the URLs

    console.log('processURLs completed successfully')
    reply.send({ message: 'URLs processed successfully.' }) // Send success response
  } catch (error) {
    console.error('Error processing URLs:', error)
    reply.status(500).send({ error: 'An error occurred while processing the URLs' }) // Send 500 Internal Server Error
  }
}

export { handleURLsRequest } // Export the handler function