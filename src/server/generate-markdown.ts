// src/server/generate-markdown.ts

import { generateMarkdown } from '../process-steps/01-generate-markdown.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function handleGenerateMarkdown(request: FastifyRequest, reply: FastifyReply) {
  type GenerateMarkdownBody = {
    type?: string
    url?: string
    filePath?: string
  }
  const body = request.body as GenerateMarkdownBody
  const type = body.type
  const url = body.url
  const filePath = body.filePath
  const options: ProcessingOptions = {}
  if (!['video','file'].includes(type || '')) {
    reply.status(400).send({ error: 'Valid type is required' })
    return
  }
  let input
  if (type === 'video') {
    if (!url) {
      reply.status(400).send({ error: 'URL is required for video' })
      return
    }
    input = url
    options.video = url
  } else {
    if (!filePath) {
      reply.status(400).send({ error: 'File path is required for file' })
      return
    }
    input = filePath
    options.file = filePath
  }
  try {
    const result = await generateMarkdown(options,input)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}