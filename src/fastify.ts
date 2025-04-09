// src/fastify.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { l } from './utils/logging.ts'
import { env } from './utils/node-utils.ts'
import { ENV_VARS_MAP } from '../shared/constants.ts'
import { handleProcessRequest } from './server/process.ts'
import { getShowNote } from './server/show-note.ts'
import { getShowNotes } from './server/show-notes.ts'
import { handleCostRequest } from './server/cost.ts'
import { handleGenerateMarkdown } from './server/generate-markdown.ts'
import { handleDownloadAudio } from './server/download-audio.ts'
import { handleRunTranscription } from './server/run-transcription.ts'
import { handleSelectPrompt } from './server/select-prompt.ts'
import { handleRunLLM } from './server/run-llm.ts'

export function buildFastify() {
  const fastify = Fastify({ logger: true })
  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  fastify.addHook('onRequest', async (request) => {
    l(`\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`)
  })

  fastify.addHook('preHandler', async (request) => {
    const body = request.body as Record<string, any>
    if (body) {
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey, envKey]) => {
        const value = (body as Record<string, string | undefined>)[bodyKey] || (body['options'] as Record<string, string | undefined>)?.[bodyKey]
        if (value) {
          process.env[envKey as string] = value
        }
      })
    }
  })

  fastify.post('/api/cost', handleCostRequest)
  fastify.post('/api/process', handleProcessRequest)
  fastify.get('/show-notes', getShowNotes)
  fastify.get('/show-notes/:id', getShowNote)
  fastify.post('/generate-markdown', handleGenerateMarkdown)
  fastify.post('/download-audio', handleDownloadAudio)
  fastify.post('/run-transcription', handleRunTranscription)
  fastify.post('/select-prompt', handleSelectPrompt)
  fastify.post('/run-llm', handleRunLLM)
  return fastify
}

export async function start() {
  const fastify = buildFastify()
  const port = Number(env['PORT']) || 3000
  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start()
}