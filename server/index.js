// server/index.js

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { handleVideoRequest } from './routes/video.js'
import { handlePlaylistRequest } from './routes/playlist.js'
import { handleURLsRequest } from './routes/urls.js'
import { handleFileRequest } from './routes/file.js'
import { handleRSSRequest } from './routes/rss.js'
import { env } from 'node:process'

// Set the port from environment variable or default to 3000
const port = env.PORT || 3000

async function start() {
  // Create a Fastify instance with logging enabled
  const fastify = Fastify({ logger: true })

  // Register CORS plugin to handle CORS headers and preflight requests
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  // Log each incoming request
  fastify.addHook('onRequest', async (request, reply) => {
    console.log(
      `[${new Date().toISOString()}] Received ${request.method} request for ${request.url}`
    )
  })

  // Define route handlers
  fastify.post('/video', handleVideoRequest)
  fastify.post('/playlist', handlePlaylistRequest)
  fastify.post('/urls', handleURLsRequest)
  fastify.post('/file', handleFileRequest)
  fastify.post('/rss', handleRSSRequest)

  try {
    await fastify.listen({ port })
    console.log(`Server running at http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()