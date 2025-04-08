// src/server/cost.ts

import { estimateTranscriptCost } from '../process-steps/03-run-transcription.ts'
import { estimateLLMCost } from '../process-steps/05-run-llm.ts'
import { l, err } from '../utils/logging.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function handleCostRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const requestData = request.body as Record<string, any> || {}
    const type = requestData['type']
    if (!['transcriptCost', 'llmCost'].includes(type)) {
      reply.status(400).send({ error: 'Valid cost type is required (transcriptCost or llmCost)' })
      return
    }
    l('\nEntered handleCostRequest for cost calculations')
    const options: ProcessingOptions = {}
    const otherOptions = ['speakerLabels', 'prompt', 'saveAudio', 'info', 'walletAddress', 'mnemonic']
    for (const opt of otherOptions) {
      if (requestData[opt] != null) {
        options[opt] = requestData[opt]
      }
    }
    const transcriptServicesRaw = requestData['transcriptServices'] || 'whisper'
    if (type === 'transcriptCost') {
      const modelField = requestData['transcriptModel'] || requestData[`${transcriptServicesRaw}Model`]
      options[transcriptServicesRaw] = modelField
    }
    const llmServices = requestData['llm']
    if (type === 'llmCost' && llmServices) {
      options[llmServices] = requestData['llmModel'] || true
    }
    const filePath = requestData['filePath']
    if (!filePath) {
      reply.status(400).send({ error: 'File path is required' })
      return
    }
    let cost
    if (type === 'transcriptCost') {
      options.transcriptCost = filePath
      cost = await estimateTranscriptCost(options, transcriptServicesRaw)
    } else {
      options.llmCost = filePath
      cost = await estimateLLMCost(options, llmServices)
    }
    reply.send({ cost })
  } catch (error) {
    err('Error processing cost request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the cost request' })
  }
}