// server/routes/video.js

import { processVideo } from '../../src/commands/processVideo.js'
import { mapRequestDataToOptions } from '../utils/mapRequestDataToOptions.js'

const handleVideoRequest = async (req, res) => {
  console.log('Entered handleVideoRequest')
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
    console.log('Received chunk:', chunk.toString())
  })

  req.on('end', async () => {
    console.log('Request body complete:', body)
    try {
      const requestData = JSON.parse(body)
      console.log('Parsed request body:', requestData)
      const { youtubeUrl } = requestData
      if (!youtubeUrl) {
        console.log('YouTube URL not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'YouTube URL is required' }))
        return
      }
      const { options, llmOpt, transcriptOpt } = mapRequestDataToOptions(requestData)
      console.log('Calling processVideo with params:', { youtubeUrl, llmOpt, transcriptOpt, options })
      await processVideo(youtubeUrl, llmOpt, transcriptOpt, options)
      console.log('processVideo completed successfully')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ 
        message: 'Video processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing video:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'An error occurred while processing the video' }))
    }
  })
}

export { handleVideoRequest }