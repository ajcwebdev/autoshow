// src/fastify.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { dbService } from './db.ts'
import { processVideo } from './process-commands/video.ts'
import { processFile } from './process-commands/file.ts'
import { estimateTranscriptCost } from './process-steps/03-run-transcription.ts'
import { estimateLLMCost, runLLM } from './process-steps/05-run-llm.ts'
import { submitShowNoteDoc } from './utils/dash-documents.ts'
import { l, err } from './utils/logging.ts'
import { env, join, writeFile } from './utils/node-utils.ts'
import { ENV_VARS_MAP, TRANSCRIPTION_SERVICES_CONFIG, LLM_SERVICES_CONFIG } from '../shared/constants.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../shared/types.ts'

export function validateRequest(requestData: Record<string, unknown>) {
  const options: ProcessingOptions = {}
  let llmServices: string | undefined
  let transcriptServices: 'whisper' | 'deepgram' | 'assembly' | undefined
  const validLlmValues = Object.values(LLM_SERVICES_CONFIG)
    .map(service => service.value)
    .filter(v => v !== null) as string[]
  const llm = requestData['llm']
  if (typeof llm === 'string' && validLlmValues.includes(llm)) {
    llmServices = llm
    if (llmServices) {
      const llmModel = requestData['llmModel']
      options[llmServices] = (typeof llmModel === 'string' ? llmModel : true)
    }
  }
  const validTranscriptValues = Object.values(TRANSCRIPTION_SERVICES_CONFIG)
    .map(s => s.value) as Array<'whisper' | 'deepgram' | 'assembly'>
  const transcriptServicesValue = requestData['transcriptServices'] as unknown
  transcriptServices = (
    typeof transcriptServicesValue === 'string' &&
    validTranscriptValues.includes(transcriptServicesValue as 'whisper'|'deepgram'|'assembly')
  )
    ? transcriptServicesValue as 'whisper'|'deepgram'|'assembly'
    : 'whisper'
  const transcriptModelRaw =
    (typeof requestData['transcriptModel'] === 'string' ? requestData['transcriptModel'] : undefined)
    || (typeof requestData[`${transcriptServices}Model`] === 'string'
          ? requestData[`${transcriptServices}Model`]
          : undefined)
  const transcriptModel = transcriptModelRaw as string | undefined
  if (transcriptServices) {
    const defaultModelId = TRANSCRIPTION_SERVICES_CONFIG[transcriptServices].models[0].modelId
    options[transcriptServices] = transcriptModel ?? defaultModelId
  }
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      options[opt] = requestData[opt]
    }
  }
  const result: {
    options: ProcessingOptions
    llmServices?: string
    transcriptServices?: 'whisper' | 'deepgram' | 'assembly'
  } = { options }
  if (llmServices !== undefined) {
    result.llmServices = llmServices
  }
  if (transcriptServices !== undefined) {
    result.transcriptServices = transcriptServices
  }
  return result
}

export const otherOptions: string[] = [
  'speakerLabels',
  'prompt',
  'saveAudio',
  'info',
  'walletAddress',
  'mnemonic'
]

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
    l(`walletAddress from request: ${walletAddress}, mnemonic from request: ${mnemonic}`)
    if (!['video', 'file', 'transcriptCost', 'llmCost', 'runLLM', 'createEmbeddings', 'queryEmbeddings'].includes(type)) {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }
    const { options, llmServices, transcriptServices } = validateRequest(requestData)
    options['walletAddress'] = walletAddress
    options['mnemonic'] = mnemonic
    if (llmServices && requestData['llmModel']) {
      if (typeof llmServices === 'string' && llmServices in options) {
        options[llmServices] = requestData['llmModel']
      }
    }
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
              result.frontMatter,
              result.prompt,
              result.llmOutput,
              result.transcript,
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
          transcript: result.transcript,
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
        l('\n[llmCost] Received request to estimate LLM cost for service:', llmServices)
        l('[llmCost] filePath from requestData is:', requestData['filePath'])
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
        l('[llmCost] calling estimateLLMCost with options:', options)
        const cost = await estimateLLMCost(options, llmServices)
        l('[llmCost] estimateLLMCost returned:', cost)
        reply.send({ cost })
        break
      }
      case 'runLLM': {
        const frontMatter = requestData['frontMatter'] as string || ''
        const prompt = requestData['prompt'] as string || ''
        const transcript = requestData['transcript'] as string || ''
        const finalPath = `llm-run-${Date.now()}`
        const metadata = {
          showLink: '',
          channel: '',
          channelURL: '',
          title: '',
          description: '',
          publishDate: '',
          coverImage: ''
        }
        if (!llmServices) {
          reply.status(400).send({ error: 'Please specify an LLM service' })
          return
        }
        await runLLM(
          options,
          finalPath,
          frontMatter,
          prompt,
          transcript,
          metadata,
          llmServices
        )
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
    const showNotes = await dbService.getShowNotes()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}

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