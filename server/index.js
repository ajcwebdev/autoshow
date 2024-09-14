// server/index.js

import http from 'node:http'
import { handleVideoRequest } from './routes/video.js'
import { handlePlaylistRequest } from './routes/playlist.js'
import { handleURLsRequest } from './routes/urls.js'
import { handleFileRequest } from './routes/file.js'
import { handleRSSRequest } from './routes/rss.js'
import { env } from 'node:process'

const port = env.PORT || 3000

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.url}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  console.log('CORS headers set')

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request')
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST') {
    switch (req.url) {
      case '/video':
        console.log('Routing to handleVideoRequest')
        await handleVideoRequest(req, res)
        break
      case '/playlist':
        console.log('Routing to handlePlaylistRequest')
        await handlePlaylistRequest(req, res)
        break
      case '/urls':
        console.log('Routing to handleURLsRequest')
        await handleURLsRequest(req, res)
        break
      case '/file':
        console.log('Routing to handleFileRequest')
        await handleFileRequest(req, res)
        break
      case '/rss':
        console.log('Routing to handleRSSRequest')
        await handleRSSRequest(req, res)
        break
      default:
        console.log('Unknown route, sending 404')
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Not Found' }))
    }
  } else {
    console.log(`Method ${req.method} not allowed, sending 405`)
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
  }
})

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})