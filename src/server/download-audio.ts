// src/server/download-audio.ts

import { downloadAudio } from '../process-steps/02-download-audio.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function handleDownloadAudio(request: FastifyRequest, reply: FastifyReply) {
  type DownloadAudioBody = {
    input?: string
    filename?: string
    options?: ProcessingOptions
  }
  const body = request.body as DownloadAudioBody
  const input = body.input
  const filename = body.filename
  if (!input || !filename) {
    reply.status(400).send({ error: 'input and filename are required' })
    return
  }
  const options: ProcessingOptions = body.options || {}
  try {
    const outputPath = await downloadAudio(options,input,filename)
    reply.send({ outputPath })
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}