// server/index.js

import Fastify from 'fastify' // Import Fastify
import cors from '@fastify/cors' // Import CORS plugin
import { handleVideoRequest } from './routes/video.js' // Import video route handler
import { handlePlaylistRequest } from './routes/playlist.js' // Import playlist route handler
import { handleURLsRequest } from './routes/urls.js' // Import URLs route handler
import { handleFileRequest } from './routes/file.js' // Import file route handler
import { handleRSSRequest } from './routes/rss.js' // Import RSS route handler
import { env } from 'node:process' // Import environment variables

const port = env.PORT || 3000 // Set the port from environment variable or default to 3000

async function start() {
  const fastify = Fastify({ logger: true }) // Create a Fastify instance with logging enabled

  // Register CORS plugin to handle CORS headers and preflight requests
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  // Log each incoming request
  fastify.addHook('onRequest', async (request, reply) => {
    console.log(`[${new Date().toISOString()}] Received ${request.method} request for ${request.url}`)
  })

  // Define route handlers
  fastify.post('/video', handleVideoRequest) // Handle POST /video requests
  fastify.post('/playlist', handlePlaylistRequest) // Handle POST /playlist requests
  fastify.post('/urls', handleURLsRequest) // Handle POST /urls requests
  fastify.post('/file', handleFileRequest) // Handle POST /file requests
  fastify.post('/rss', handleRSSRequest) // Handle POST /rss requests

  // Removed the manual OPTIONS route to avoid conflict with @fastify/cors

  // Start the Fastify server
  try {
    await fastify.listen({ port })
    console.log(`Server running at http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() // Start the server