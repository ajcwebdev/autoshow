// server/routes/file.js

import { processFile } from '../../../src/commands/processFile.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /file route
const handleFileRequest = async (request, reply) => {
  console.log('\nEntered handleFileRequest')

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
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('\nCalling processFile with params:', { filePath, llmOpt, transcriptOpt, options })

    await processFile(filePath, llmOpt, transcriptOpt, options)

    console.log('\nprocessFile completed successfully')
    reply.send({ message: 'File processed successfully.' })
  } catch (error) {
    console.error('Error processing file:', error)
    reply.status(500).send({ error: 'An error occurred while processing the file' })
  }
}

export { handleFileRequest }