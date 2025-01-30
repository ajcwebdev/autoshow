// src/server/routes/process.ts

import { processVideo } from '../../process-commands/video'
import { processFile } from '../../process-commands/file'
import { validateRequest, validateServerProcessAction } from '../../utils/validate-option'
import { l, err } from '../../../src/utils/logging'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessRequestBody } from '../../utils/types/process'

/**
 * Handler for the /process route.
 * Receives and validates the request body, maps request data to processing options,
 * and calls the appropriate process handler based on the provided process type.
 *
 * @param request - FastifyRequest object containing the incoming request data
 * @param reply - FastifyReply object for sending the response
 * @returns A Promise that resolves to void
 */
export const handleProcessRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handleProcessRequest')

  try {
    // Access parsed request body
    const requestData = request.body as ProcessRequestBody
    l('\nParsed request body:', requestData)

    const { type } = requestData

    try {
      validateServerProcessAction(type)
    } catch {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = validateRequest(requestData)

    // Ensure the user-selected LLM model is passed through to the options object
    if (llmServices && requestData['llmModel']) {
      options[llmServices] = requestData['llmModel']
    }

    // Process based on type
    switch (type) {
      case 'video': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'YouTube URL is required' })
          return
        }
        options.video = url
        const result = await processVideo(options, url, llmServices, transcriptServices)
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
        break
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        options.file = filePath
        const result = await processFile(options, filePath, llmServices, transcriptServices)
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
        break
      }
    }

    l('\nProcess completed successfully')
  } catch (error) {
    err('Error processing request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the request' })
  }
}