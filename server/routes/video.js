// server/routes/video.js

import { processVideo } from '../../src/commands/processVideo.js' // Import processVideo function
import { reqToOpts } from '../utils/reqToOpts.js' // Import utility function

// Handler for /video route
const handleVideoRequest = async (request, reply) => {
  console.log('Entered handleVideoRequest')

  try {
    const requestData = request.body // Access parsed request body
    console.log('Parsed request body:', requestData)

    const { youtubeUrl } = requestData // Extract YouTube URL

    if (!youtubeUrl) {
      console.log('YouTube URL not provided, sending 400')
      reply.status(400).send({ error: 'YouTube URL is required' }) // Send 400 Bad Request
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processVideo with params:', { youtubeUrl, llmOpt, transcriptOpt, options })

    await processVideo(youtubeUrl, llmOpt, transcriptOpt, options) // Process the video

    console.log('processVideo completed successfully')
    reply.send({ message: 'Video processed successfully.' }) // Send success response
  } catch (error) {
    console.error('Error processing video:', error)
    reply.status(500).send({ error: 'An error occurred while processing the video' }) // Send 500 Internal Server Error
  }
}

export { handleVideoRequest } // Export the handler function