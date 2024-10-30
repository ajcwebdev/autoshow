// server/routes/file.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { processFile } from '../../../src/commands/processFile.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for the /file route
export const handleFileRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  console.log('\nEntered handleFileRequest')

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

    // Set options.file to filePath
    options.file = filePath

    console.log('\nCalling processFile with params:', {
      filePath,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processFile with the mapped options and extracted file path
    await processFile(options, filePath, llmServices, transcriptServices)

    console.log('\nprocessFile completed successfully')
    reply.send({ message: 'File processed successfully.' })
  } catch (error) {
    console.error('Error processing file:', error)
    reply.status(500).send({ error: 'An error occurred while processing the file' })
  }
}