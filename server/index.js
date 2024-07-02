// server/index.js

import http from 'http'
import { processVideo } from '../commands/processVideo.js'
import { getModel } from '../utils/index.js'

const port = 3000

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/video') {
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
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  }
})

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})