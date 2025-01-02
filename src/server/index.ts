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

  /**
   * @description Pre-handler to override environment variables from request body if provided.
   * This ensures that API keys can be passed in the request and used for the session,
   * even if they're not set in the .env file.
   */
  interface RequestBody {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    deepgramApiKey?: string;
    assemblyApiKey?: string;
    geminiApiKey?: string;
    cohereApiKey?: string;
    mistralApiKey?: string;
    grokApiKey?: string;
    togetherApiKey?: string;
    fireworksApiKey?: string;
    groqApiKey?: string;
  }

  fastify.addHook('preHandler', async (request) => {
    const body = request.body as RequestBody;
    if (body) {
      if (body.openaiApiKey) process.env['OPENAI_API_KEY'] = body.openaiApiKey;
      if (body.anthropicApiKey) process.env['ANTHROPIC_API_KEY'] = body.anthropicApiKey;
      if (body.deepgramApiKey) process.env['DEEPGRAM_API_KEY'] = body.deepgramApiKey;
      if (body.assemblyApiKey) process.env['ASSEMBLY_API_KEY'] = body.assemblyApiKey;
      if (body.geminiApiKey) process.env['GEMINI_API_KEY'] = body.geminiApiKey;
      if (body.cohereApiKey) process.env['COHERE_API_KEY'] = body.cohereApiKey;
      if (body.mistralApiKey) process.env['MISTRAL_API_KEY'] = body.mistralApiKey;
      if (body.grokApiKey) process.env['GROK_API_KEY'] = body.grokApiKey;
      if (body.togetherApiKey) process.env['TOGETHER_API_KEY'] = body.togetherApiKey;
      if (body.fireworksApiKey) process.env['FIREWORKS_API_KEY'] = body.fireworksApiKey;
      if (body.groqApiKey) process.env['GROQ_API_KEY'] = body.groqApiKey;
    }
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