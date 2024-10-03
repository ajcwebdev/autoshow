// server/routes/file.js

import { processFile } from '../../src/commands/processFile.js' // Import processFile function
import { reqToOpts } from '../utils/reqToOpts.js' // Import utility function

// Handler for /file route
const handleFileRequest = async (request, reply) => {
  console.log('Entered handleFileRequest')

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
    console.log('Calling processFile with params:', { filePath, llmOpt, transcriptOpt, options })

    await processFile(filePath, llmOpt, transcriptOpt, options) // Process the file

    console.log('processFile completed successfully')
    reply.send({ message: 'File processed successfully.' }) // Send success response
  } catch (error) {
    console.error('Error processing file:', error)
    reply.status(500).send({ error: 'An error occurred while processing the file' }) // Send 500 Internal Server Error
  }
}

export { handleFileRequest } // Export the handler function