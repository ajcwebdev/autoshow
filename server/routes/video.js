// server/routes/video.js

import { processVideo } from '../../src/commands/processVideo.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /video route
const handleVideoRequest = async (request, reply) => {
  console.log('Entered handleVideoRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('Parsed request body:', requestData)

    // Extract YouTube URL
    const { youtubeUrl } = requestData

    if (!youtubeUrl) {
      console.log('YouTube URL not provided, sending 400')
      reply.status(400).send({ error: 'YouTube URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processVideo with params:', { youtubeUrl, llmOpt, transcriptOpt, options })

    await processVideo(youtubeUrl, llmOpt, transcriptOpt, options)

    console.log('processVideo completed successfully')
    reply.send({ message: 'Video processed successfully.' })
  } catch (error) {
    console.error('Error processing video:', error)
    reply.status(500).send({ error: 'An error occurred while processing the video' })
  }
}

export { handleVideoRequest }