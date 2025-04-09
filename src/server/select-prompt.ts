// src/server/select-prompt.ts

import { selectPrompts } from '../process-steps/04-select-prompt.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function handleSelectPrompt(request: FastifyRequest, reply: FastifyReply) {
  type SelectPromptBody = {
    options?: ProcessingOptions
  }
  const body = request.body as SelectPromptBody
  const options: ProcessingOptions = body.options || {}
  try {
    const prompt = await selectPrompts(options)
    reply.send({ prompt })
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}