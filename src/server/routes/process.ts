// src/server/routes/process.ts

import { processVideo } from '../../process-commands/video'
import { processURLs } from '../../process-commands/urls'
import { processRSS } from '../../process-commands/rss'
import { processPlaylist } from '../../process-commands/playlist'
import { processChannel } from '../../process-commands/channel'
import { processFile } from '../../process-commands/file'
import { validateRequest, isValidProcessType } from '../../utils/validate-option'
import { l, err } from '../../../src/utils/logging'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessRequestBody } from '../../types/process'

// Handler for the /process route
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

    if (!type || !isValidProcessType(type)) {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = validateRequest(requestData)

    // Process based on type
    switch (type) {
      case 'video': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'YouTube URL is required' })
          return
        }
        options.video = url
        const content = await processVideo(options, url, llmServices, transcriptServices)
        reply.send({ content })
        break
      }

      case 'channel': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'Channel URL is required' })
          return
        }
        options.channel = url
        const content = await processChannel(options, url, llmServices, transcriptServices)
        reply.send({ content })
        break
      }

      case 'urls': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        options.urls = filePath
        await processURLs(options, filePath, llmServices, transcriptServices)
        reply.send({ message: 'URLs processed successfully.' })
        break
      }

      case 'rss': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'RSS URL is required' })
          return
        }
        options.rss = url
        await processRSS(options, url, llmServices, transcriptServices)
        reply.send({ message: 'RSS feed processed successfully.' })
        break
      }

      case 'playlist': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'Playlist URL is required' })
          return
        }
        options.playlist = url
        await processPlaylist(options, url, llmServices, transcriptServices)
        reply.send({ message: 'Playlist processed successfully.' })
        break
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        options.file = filePath
        await processFile(options, filePath, llmServices, transcriptServices)
        reply.send({ message: 'File processed successfully.' })
        break
      }
    }

    l('\nProcess completed successfully')
  } catch (error) {
    err('Error processing request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the request' })
  }
}