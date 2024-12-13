// src/server/index.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { handleProcessRequest } from './routes/process'
import { getShowNotes } from './routes/show-notes'
import { getShowNote } from './routes/show-note'
import { l } from '../../src/utils/logging'
import { env } from 'node:process'

const port = Number(env['PORT']) || 3000

async function start() {
  const fastify = Fastify({ logger: true })

  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  fastify.addHook('onRequest', async (request) => {
    l(
      `\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`
    )
  })

  // Combined process endpoint
  fastify.post('/process', handleProcessRequest)
  
  // Show notes endpoints
  fastify.get('/show-notes', getShowNotes)
  fastify.get('/show-notes/:id', getShowNote)

  try {
    await fastify.listen({ port })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()