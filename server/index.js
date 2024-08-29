// server/index.js

import http from 'http'
import { handleVideoRequest } from './video.js'
import { handlePlaylistRequest } from './playlist.js'
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
    if (req.url === '/video') {
      await handleVideoRequest(req, res)
    } else if (req.url === '/playlist') {
      await handlePlaylistRequest(req, res)
    } else {
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