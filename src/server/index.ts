// src/server/index.js

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { handleVideoRequest } from './routes/video'
import { handlePlaylistRequest } from './routes/playlist'
import { handleURLsRequest } from './routes/urls'
import { handleFileRequest } from './routes/file'
import { handleRSSRequest } from './routes/rss'
import { l } from '../../src/utils/logging'
import { env } from 'node:process'
import { getShowNotes } from './routes/show-notes'
import { getShowNote } from './routes/show-note'

// Set the port from environment variable or default to 3000
// const port = Number(env.PORT) || 3000
const port = Number(env['PORT']) || 3000

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
  fastify.addHook('onRequest', async (request) => {
    l(
      `\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`
    )
  })

  // Define route handlers
  fastify.post('/video', handleVideoRequest)
  fastify.post('/playlist', handlePlaylistRequest)
  fastify.post('/urls', handleURLsRequest)
  fastify.post('/file', handleFileRequest)
  fastify.post('/rss', handleRSSRequest)
  fastify.get('/show-notes', getShowNotes)
  fastify.get('/show-notes/:id', getShowNote)

  try {
    // Start the server and listen on the specified port
    await fastify.listen({ port })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    // Log errors and exit if the server fails to start
    fastify.log.error(err)
    process.exit(1)
  }
}

start()