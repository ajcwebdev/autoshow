// src/fastify.ts

import { env } from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { dbService } from './db'
import { processVideo } from './process-commands/video'
import { processFile } from './process-commands/file'
import { l, err } from './utils/logging'
import { validateRequest, validateServerProcessAction, envVarsServerMap } from './utils/validation/requests'
import { estimateTranscriptCost } from './process-steps/03-run-transcription-utils'
import { estimateLLMCost, runLLMFromPromptFile } from './process-steps/05-run-llm-utils'
import { createEmbeddingsAndSQLite } from './utils/embeddings/create-embed'
import { queryEmbeddings } from './utils/embeddings/query-embed'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'

import type { FastifyRequest, FastifyReply } from 'fastify'

// Set server port from environment variable or default to 3000
const port = Number(env['PORT']) || 3000

// Explicitly set server mode for database service
env['SERVER_MODE'] = 'true'

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

    const { type, walletAddress, mnemonic } = requestData
    l(`walletAddress from request: ${walletAddress}, mnemonic from request: ${mnemonic}`)

    try {
      validateServerProcessAction(type)
    } catch {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = validateRequest(requestData)
    options['walletAddress'] = walletAddress
    options['mnemonic'] = mnemonic

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

        /**
         * Write the entire result to a .json file in the "content" directory
         * @type {string}
         */
        const contentDir = join(process.cwd(), 'content')
        const timestamp = Date.now()
        const outputPath = join(contentDir, `video-${timestamp}.json`)
        await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')

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

        /**
         * Write the entire result to a .json file in the "content" directory
         * @type {string}
         */
        const contentDir = join(process.cwd(), 'content')
        const timestamp = Date.now()
        const outputPath = join(contentDir, `file-${timestamp}.json`)
        await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')

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

      case 'createEmbeddings': {
        /**
         * Creates embeddings by reading .md files (recursively) from the specified directory
         * (or defaults to the "content" directory if none provided) and storing them in the
         * Postgres "embeddings" table via Prisma.
         *
         * @async
         * @param {string} [directory] - An optional directory path to scan for markdown files
         * @returns {Promise<void>} - Responds with a success message once embeddings are created
         */
        const { directory } = requestData
        await createEmbeddingsAndSQLite(directory)
        reply.send({ message: 'Embeddings created successfully' })
        break
      }

      case 'queryEmbeddings': {
        /**
         * Queries the embeddings in the Postgres "embeddings" table for the most relevant documents
         * based on the question provided in the request body, optionally scoped to a directory.
         *
         * @async
         * @param {string} question - The user question
         * @param {string} [directory] - Optional directory path used to locate .md files
         * @returns {Promise<void>} - Responds with a success message once query is complete
         */
        const { question, directory } = requestData
        if (!question) {
          reply.status(400).send({ error: 'A question is required to query embeddings' })
          return
        }
        await queryEmbeddings(question, directory)
        reply.send({ message: 'Query embeddings completed successfully' })
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
    const showNote = await dbService.getShowNote(Number(id))
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
    const showNotes = await dbService.getShowNotes()
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