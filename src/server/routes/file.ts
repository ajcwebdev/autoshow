// src/server/routes/file.ts

import type { FastifyRequest, FastifyReply } from 'fastify'
import { processFile } from '../../commands/process-file'
import { reqToOpts } from '../utils/req-to-opts'
import { l, err } from '../../../src/utils/logging'

// Define a type for the request body
interface FileRequestBody {
  filePath?: string
}

// Handler for the /file route
export const handleFileRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handleFileRequest')

  try {
    // Access parsed request body
    const requestData = request.body as FileRequestBody
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

    // Set options.file to filePath
    options.file = filePath

    l('\nCalling processFile with params:', {
      filePath,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processFile with the mapped options and extracted file path
    await processFile(options, filePath, llmServices, transcriptServices)

    l('\nprocessFile completed successfully')
    reply.send({ message: 'File processed successfully.' })
  } catch (error) {
    err('Error processing file:', error)
    reply.status(500).send({ error: 'An error occurred while processing the file' })
  }
}