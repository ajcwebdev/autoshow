// server/index.js

import http from 'http'
import { handleVideoRequest } from './routes/video.js'
import { handlePlaylistRequest } from './routes/playlist.js'
import { handleURLsRequest } from './routes/urls.js'
import { handleFileRequest } from './routes/file.js'
import { handleRSSRequest } from './routes/rss.js'
import { env } from 'node:process'

const port = env.PORT || 3000

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method === 'POST') {
    switch (req.url) {
      case '/video':
        await handleVideoRequest(req, res)
        break
      case '/playlist':
        await handlePlaylistRequest(req, res)
        break
      case '/urls':
        await handleURLsRequest(req, res)
        break
      case '/file':
        await handleFileRequest(req, res)
        break
      case '/rss':
        await handleRSSRequest(req, res)
        break
      default:
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not Found' }))
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  }
})

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})