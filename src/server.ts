// src/server/index.ts

import { DatabaseSync } from 'node:sqlite'
import { env } from 'node:process'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { processVideo } from './process-commands/video'
import { processFile } from './process-commands/file'
import { l, err } from './utils/logging'
import { envVarsServerMap } from './utils/step-utils/llm-utils'
import { validateRequest, validateServerProcessAction } from './utils/validate-option'

import type { RequestBody, ProcessRequestBody, ShowNote } from './utils/types/process'
import type { FastifyRequest, FastifyReply } from 'fastify'

// Set server port from environment variable or default to 3000
const port = Number(env['PORT']) || 3000

// Initialize the database connection
export const db = new DatabaseSync('show_notes.db', { open: true })

// Create the show_notes table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS show_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    showLink TEXT,
    channel TEXT,
    channelURL TEXT,
    title TEXT NOT NULL,
    description TEXT,
    publishDate TEXT NOT NULL,
    coverImage TEXT,
    frontmatter TEXT,
    prompt TEXT,
    transcript TEXT,
    llmOutput TEXT
  )
`)

/**
 * Insert new show note row into database.
 * @param {ShowNote} showNote - The show note data to insert
 */
export function insertShowNote(showNote: ShowNote): void {
  l.dim('\n  Inserting show note into the database...')

  const {
    showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
  } = showNote
  
  db.prepare(`
    INSERT INTO show_notes (
      showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    showLink, channel, channelURL, title, description, publishDate, coverImage, frontmatter, prompt, transcript, llmOutput
  )
  
  l.dim('    - Show note inserted successfully.\n')
}

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
): Promise<void> => {
  l('\nEntered handleProcessRequest')

  try {
    // Access parsed request body
    const requestData = request.body as ProcessRequestBody
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
      options[llmServices] = requestData['llmModel']
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
    const body = request.body as RequestBody
    if (body) {
      Object.entries(envVarsServerMap).forEach(([bodyKey, envKey]) => {
        const value = (body as Record<string, string | undefined>)[bodyKey]
        if (value) {
          process.env[envKey as string] = value
        }
      })
    }
  })

  fastify.post('/process', handleProcessRequest)   // POST endpoint for processing
  fastify.get('/show-notes', getShowNotes)         // GET endpoint for all show notes
  fastify.get('/show-notes/:id', getShowNote)      // GET endpoint for specific show note

  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    l(`\nServer running at http://localhost:${port}\n`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()