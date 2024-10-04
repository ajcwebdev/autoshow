// server/routes/video.js

import { processVideo } from '../../../src/commands/processVideo.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /video route
const handleVideoRequest = async (request, reply) => {
  console.log('\nEntered handleVideoRequest\n')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('\nParsed request body:', requestData)

    // Extract YouTube URL
    const { youtubeUrl } = requestData

    if (!youtubeUrl) {
      console.log('YouTube URL not provided, sending 400')
      reply.status(400).send({ error: 'YouTube URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)
    console.log('\nCalling processVideo with params:', { youtubeUrl, llmServices, transcriptServices, options })

    await processVideo(youtubeUrl, llmServices, transcriptServices, options)

    console.log('\nprocessVideo completed successfully')
    reply.send({ message: 'Video processed successfully.' })
  } catch (error) {
    console.error('Error processing video:', error)
    reply.status(500).send({ error: 'An error occurred while processing the video' })
  }
}

export { handleVideoRequest }