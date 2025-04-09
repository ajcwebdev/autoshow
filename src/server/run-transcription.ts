// src/server/run-transcription.ts

import { runTranscription } from '../process-steps/03-run-transcription.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function handleRunTranscription(request: FastifyRequest, reply: FastifyReply) {
  type RunTranscriptionBody = {
    finalPath?: string
    transcriptServices?: string
    options?: ProcessingOptions
  }
  const body = request.body as RunTranscriptionBody
  const finalPath = body.finalPath
  const transcriptServices = body.transcriptServices
  if (!finalPath || !transcriptServices) {
    reply.status(400).send({ error: 'finalPath and transcriptServices are required' })
    return
  }
  const options: ProcessingOptions = body.options || {}
  try {
    const result = await runTranscription(options,finalPath,transcriptServices)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}