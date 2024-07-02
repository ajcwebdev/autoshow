// server/index.js

import http from 'http'
import { handleVideoRequest } from './video.js'

const port = process.env.PORT || 3000

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/video') {
    await handleVideoRequest(req, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
  }
})

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})