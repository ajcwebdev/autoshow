// server/video.js

import { processVideo } from '../../src/commands/processVideo.js'

const handleVideoRequest = async (req, res) => {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const { youtubeUrl, model = 'base', llm } = JSON.parse(body)
      if (!youtubeUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'YouTube URL is required' }))
        return
      }
      const llmOption = llm || null
      const transcriptionOption = model || 'base'
      const options = {}
      const finalContent = await processVideo(youtubeUrl, llmOption, transcriptionOption, options)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'Video processed successfully.',
        content: finalContent
      }))
    } catch (error) {
      console.error('Error processing video:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the video' }))
    }
  })
}

export { handleVideoRequest }