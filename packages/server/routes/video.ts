// server/routes/video.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { processVideo } from '../../../src/commands/processVideo.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for the /video route
export const handleVideoRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  console.log('\nEntered handleVideoRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    console.log('\nParsed request body:', requestData)

    // Extract YouTube URL from the request data
    const { youtubeUrl } = requestData

    if (!youtubeUrl) {
      console.log('YouTube URL not provided, sending 400')
      reply.status(400).send({ error: 'YouTube URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.video to youtubeUrl
    options.video = youtubeUrl

    console.log('\nCalling processVideo with params:', {
      youtubeUrl,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processVideo with the mapped options and extracted URL
    await processVideo(options, youtubeUrl, llmServices, transcriptServices)

    console.log('\nprocessVideo completed successfully')
    reply.send({ message: 'Video processed successfully.' })
  } catch (error) {
    console.error('Error processing video:', error)
    reply.status(500).send({ error: 'An error occurred while processing the video' })
  }
}