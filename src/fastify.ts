// src/fastify.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { dbService } from './db.ts'
import { processVideo } from './process-commands/video.ts'
import { processFile } from './process-commands/file.ts'
import { estimateTranscriptCost } from './process-steps/03-run-transcription-utils.ts'
import { estimateLLMCost, runLLMFromPromptFile } from './process-steps/05-run-llm-utils.ts'
import { createEmbeds } from './utils/embeddings/create-embed.ts'
import { queryEmbeddings } from './utils/embeddings/query-embed.ts'
import { submitShowNoteDoc } from './utils/dash-documents.ts'
import { l, err, logErrorAndMaybeExit } from './utils/logging.ts'
import { env, join, writeFile } from './utils/node-utils.ts'
import { ENV_VARS_MAP } from '../shared/constants.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../shared/types.ts'
import { resolveLLMService, resolveTranscriptionService } from './utils/service-resolver.ts'

export function validateRequest(requestData: Record<string, unknown>) {
  const options: ProcessingOptions = {}
  for (const opt of Object.keys(requestData)) {
    options[opt] = requestData[opt]
  }
  const llm = resolveLLMService(options)
  const transcript = resolveTranscriptionService(options)
  return {
    options,
    llmServices: llm.service,
    transcriptServices: transcript.service
  }
}

export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'saveAudio',
  'info',
  'walletAddress',
  'mnemonic'
]

const port = Number(env['PORT']) || 3000
env['SERVER_MODE'] = 'true'

export const handleProcessRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  l('\nEntered handleProcessRequest')
  try {
    const requestData = request.body as Record<string, unknown>
    l('\nParsed request body:', requestData)

    const type = requestData['type'] as string
    const walletAddress = requestData['walletAddress'] as string | undefined
    const mnemonic = requestData['mnemonic'] as string | undefined

    const validTypes = [
      'video',
      'file',
      'transcriptCost',
      'llmCost',
      'runLLM',
      'createEmbeddings',
      'queryEmbeddings'
    ]

    if (!validTypes.includes(type)) {
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    const { options, llmServices, transcriptServices } = validateRequest(requestData)
    // Use bracket notation for TS
    options['walletAddress'] = walletAddress
    options['mnemonic'] = mnemonic

    switch (type) {
      case 'video': {
        const url = requestData['url'] as string
        const identityId = requestData['identityId'] as string
        const contractId = requestData['contractId'] as string
        if (!url) {
          reply.status(400).send({ error: 'YouTube URL is required' })
          return
        }
        options.video = url
        const result = await processVideo(options, url, llmServices, transcriptServices)
        const contentDir = join(process.cwd(), 'content')
        const timestamp = Date.now()
        const outputPath = join(contentDir, `video-${timestamp}.json`)
        await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')

        let dashDocumentId = ''
        if (identityId && contractId) {
          try {
            dashDocumentId = await submitShowNoteDoc(
              identityId,
              contractId,
              result.frontMatter ?? '',
              result.prompt ?? '',
              result.llmOutput ?? '',
              result.transcript ?? '',
              options['mnemonic']
            )
            l(`Dash document created with ID: ${dashDocumentId}`)
          } catch (subErr) {
            err('Error creating Dash document after video processing:', subErr)
          }
        }
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
          dashDocumentId
        })
        break
      }
      case 'file': {
        const filePath = requestData['filePath'] as string
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        options.file = filePath
        const result = await processFile(options, filePath, llmServices, transcriptServices)
        const contentDir = join(process.cwd(), 'content')
        const timestamp = Date.now()
        const outputPath = join(contentDir, `file-${timestamp}.json`)
        await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript
        })
        break
      }
      case 'transcriptCost': {
        const filePath = requestData['filePath'] as string
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        if (!transcriptServices) {
          reply.status(400).send({ error: 'Please specify a transcription service' })
          return
        }
        options.transcriptCost = filePath
        const cost = await estimateTranscriptCost(options, transcriptServices)
        l(cost)
        reply.send({ cost })
        break
      }
      case 'llmCost': {
        const filePath = requestData['filePath'] as string
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
          return
        }
        if (!llmServices) {
          reply.status(400).send({ error: 'Please specify an LLM service' })
          return
        }
        options.llmCost = filePath
        const cost = await estimateLLMCost(options, llmServices)
        l('[llmCost] estimateLLMCost returned:', cost)
        reply.send({ cost })
        break
      }
      case 'runLLM': {
        const filePath = requestData['filePath'] as string
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
        const directory = requestData['directory'] as string | undefined
        await createEmbeds(directory)
        reply.send({ message: 'Embeddings created successfully' })
        break
      }
      case 'queryEmbeddings': {
        const question = requestData['question'] as string
        const directory = requestData['directory'] as string | undefined
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
    const e = error instanceof Error ? error : new Error(String(error))
    logErrorAndMaybeExit('Error processing request:', e, false)
    reply.status(500).send({ error: 'An error occurred while processing the request' })
  }
}

export async function getShowNote(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const showNote = await dbService.getShowNote(Number(id))
    if (showNote) {
      reply.send({ showNote })
    } else {
      reply.status(404).send({ error: 'Show note not found' })
    }
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    logErrorAndMaybeExit('Error fetching show note:', e, false)
    reply.status(500).send({ error: 'An error occurred while fetching the show note' })
  }
}

export async function getShowNotes(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const showNotes = await dbService.getShowNotes()
    reply.send({ showNotes })
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    logErrorAndMaybeExit('Error fetching show notes:', e, false)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}

async function start() {
  const fastify = Fastify({ logger: true })
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  })

  fastify.addHook('onRequest', async (request) => {
    l(`\n[${new Date().toISOString()}] Received ${request.method} request for ${request.url}\n`)
  })

  fastify.addHook('preHandler', async (request) => {
    const body = request.body
    if (body) {
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey, envKey]) => {
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
    console.error(err)
    process.exit(1)
  }
}

start()
