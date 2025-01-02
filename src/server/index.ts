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

// Main async function to initialize and start the server
async function start() {
  // Initialize Fastify instance with logging enabled
  const fastify = Fastify({ logger: true })

  // Register CORS middleware with configuration
  await fastify.register(cors, {
    origin: '*',                              // Allow requests from any origin
    methods: ['GET', 'POST', 'OPTIONS'],      // Allow specified HTTP methods
    allowedHeaders: ['Content-Type'],         // Allow Content-Type header
  })

  // Add global request hook that logs incoming requests
  fastify.addHook('onRequest', async (request) => {
    l(
      // Log timestamp, HTTP method and requested URL for each request
      `\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`
    )
  })

  // Register route handlers for different endpoints
  fastify.post('/process', handleProcessRequest)    // POST endpoint for processing
  fastify.get('/show-notes', getShowNotes)         // GET endpoint for all show notes
  fastify.get('/show-notes/:id', getShowNote)      // GET endpoint for specific show note

  try {
    // Start the server
    await fastify.listen({
      port,                // Use configured port
      host: '::',    // Listen on all network interfaces
    })

    // Log successful server start
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    // Log any startup errors
    fastify.log.error(err)
    // Exit process with error code
    process.exit(1)
  }
}

// Execute the start function to boot up the server
start()