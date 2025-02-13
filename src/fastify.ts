// src/fastify.ts

import { env } from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db'
import { processVideo } from './process-commands/video'
import { processFile } from './process-commands/file'
import { runLLMFromPromptFile } from './process-steps/05-run-llm'
import { l, err } from './utils/logging'
import { validateRequest, validateServerProcessAction, envVarsServerMap } from './utils/validation/validate-req'
import { estimateTranscriptCost } from './utils/step-utils/transcription-utils'
import { estimateLLMCost } from './utils/step-utils/llm-utils'

import type { FastifyRequest, FastifyReply } from 'fastify'

// Set server port from environment variable or default to 3000
const port = Number(env['PORT']) || 3000

/**
 * Handler for the /process route.
 * Receives and validates the request body, maps request data to processing options,
 * and calls the appropriate process handler based on the provided process type.
 *
 * @param request - FastifyRequest object containing the incoming request data
 * @param reply - FastifyReply object for sending the response
 * @returns A Promise that resolves to void
 */
export const handleProcessRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  l('\nEntered handleProcessRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    l('\nParsed request body:', requestData)

    const { type } = requestData

    try {
      validateServerProcessAction(type)
    } catch {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = validateRequest(requestData)

    // Ensure the user-selected LLM model is passed through to the options object
    if (llmServices && requestData['llmModel']) {
      if (typeof llmServices === 'string' && llmServices in options) {
        options[llmServices] = requestData['llmModel']
      }
    }

    // Process based on type
    switch (type) {
      case 'video': {
        const { url } = requestData
        if (!url) {
          reply.status(400).send({ error: 'YouTube URL is required' })
          return
        }
        options.video = url
        const result = await processVideo(options, url, llmServices, transcriptServices)
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
        break
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        options.file = filePath
        const result = await processFile(options, filePath, llmServices, transcriptServices)
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
        break
      }

      /**
       * Handles transcript cost estimates for the server
       * Accepts "filePath" and "transcriptServices" from the request body
       */
      case 'transcriptCost': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        if (!transcriptServices) {
          reply.status(400).send({ error: 'Please specify a transcription service' })
          return
        }
        options.transcriptCost = filePath
        await estimateTranscriptCost(options, transcriptServices)
        reply.send({ message: 'Transcript cost estimated successfully' })
        break
      }

      /**
       * Handles LLM cost estimation
       * Accepts "filePath" (combined prompt+transcript) and "llm"
       */
      case 'llmCost': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        if (!llmServices) {
          reply.status(400).send({ error: 'Please specify an LLM service' })
          return
        }
        options.llmCost = filePath
        await estimateLLMCost(options, llmServices)
        reply.send({ message: 'LLM cost estimated successfully' })
        break
      }

      /**
       * Skips steps 1-4 and runs an LLM directly on a file with a transcript and prompt
       * Accepts "filePath" and "llm"
       */
      case 'runLLM': {
        const { filePath } = requestData
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        if (!llmServices) {
          reply.status(400).send({ error: 'Please specify an LLM service' })
          return
        }
        options.runLLM = filePath
        await runLLMFromPromptFile(filePath, options, llmServices)
        reply.send({ message: 'LLM run completed successfully' })
        break
      }
    }

    l('\nProcess completed successfully')
  } catch (error) {
    err('Error processing request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the request' })
  }
}

export const getShowNote = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    // Fetch the show note from the database
    const showNote = db.prepare(`SELECT * FROM show_notes WHERE id = ?`).get(id)
    if (showNote) {
      reply.send({ showNote })
    } else {
      reply.status(404).send({ error: 'Show note not found' })
    }
  } catch (error) {
    console.error('Error fetching show note:', error)
    reply.status(500).send({ error: 'An error occurred while fetching the show note' })
  }
}

export const getShowNotes = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Fetch all show notes from the database
    const showNotes = db.prepare(`SELECT * FROM show_notes ORDER BY publishDate DESC`).all()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}

async function start() {
  const fastify = Fastify({ logger: true })
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })

  fastify.addHook('onRequest', async (request) => {
    l(`\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`)
  })

  fastify.addHook('preHandler', async (request) => {
    const body = request.body
    if (body) {
      Object.entries(envVarsServerMap).forEach(([bodyKey, envKey]) => {
        const value = (body as Record<string, string | undefined>)[bodyKey]
        if (value) {
          process.env[envKey as string] = value
        }
      })
    }
  })

  fastify.post('/api/process', handleProcessRequest)
  fastify.get('/show-notes', getShowNotes)
  fastify.get('/show-notes/:id', getShowNote)

  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()