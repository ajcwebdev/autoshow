// server/video.js

import { processVideo } from '../commands/processVideo.js'
import { getModel } from '../utils/index.js'

const handleVideoRequest = async (req, res) => {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const { youtubeUrl } = JSON.parse(body)

      if (!youtubeUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'YouTube URL is required' }))
        return
      }

      const model = getModel('base')                                              // TODO: Make this configurable
      const commonArgs = [model, false, false, false, false, false, false, false] // TODO: Add support for LLM and Transcription APIs

      await processVideo(youtubeUrl, ...commonArgs)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Video processing.' }))
    } catch (error) {
      console.error('Error processing video:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the video' }))
    }
  })
}

export { handleVideoRequest }