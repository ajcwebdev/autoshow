// src/server/index.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { handleProcessRequest } from './routes/process'
import { getShowNotes } from './routes/show-notes'
import { getShowNote } from './routes/show-note'
import { l } from '../../src/utils/logging'
import { env } from 'node:process'

// Set server port from environment variable or default to 3000
const port = Number(env['PORT']) || 3000

// Initialize Fastify instance with logging enabled and CORS middleware
async function start() {
  const fastify = Fastify({ logger: true })
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  // Global request hook for logging timestamp, HTTP method, and requested URL for each incoming request
  fastify.addHook('onRequest', async (request) => {
    l(`\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`)
  })

  // Register route handlers for different endpoints
  fastify.post('/process', handleProcessRequest)    // POST endpoint for processing
  fastify.get('/show-notes', getShowNotes)         // GET endpoint for all show notes
  fastify.get('/show-notes/:id', getShowNote)      // GET endpoint for specific show note

  // Start server, use configured port, listen on all network interfaces, and log successful start
  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Execute the start function to boot up the server
start()