// server/routes/video.js

import { processVideo } from '../../src/commands/processVideo.js'

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
      const { youtubeUrl, model, llm, options = {} } = JSON.parse(body)
      console.log('Parsed request body:', { youtubeUrl, model, llm, options })
      if (!youtubeUrl) {
        console.log('YouTube URL not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'YouTube URL is required' }))
        return
      }
      const llmOption = llm || null
      const whisperModel = model || 'base'
      console.log('Calling processVideo with params:', { youtubeUrl, llmOption, whisperModel, options })
      const finalContent = await processVideo(youtubeUrl, llmOption, whisperModel, options)
      console.log('processVideo completed successfully')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ 
        message: 'Video processed successfully.',
        content: finalContent
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