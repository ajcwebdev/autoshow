// src/server/cost.ts

import { l, err } from '../logging.ts'
import { execPromise, readFile } from '../utils.ts'
import { T_CONFIG, L_CONFIG } from '../../shared/constants.ts'

import type { FastifyRequest, FastifyReply } from 'fastify'

// Gets audio duration in seconds via ffprobe
async function getAudioDurationInSeconds(filePath: string) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  return seconds
}

// Computes cost for all transcription services/models
async function computeAllTranscriptCosts(filePath: string) {
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  for (const [serviceName, config] of Object.entries(T_CONFIG)) {
    result[serviceName] = []
    for (const model of config.models) {
      const cost = model.costPerMinuteCents * minutes
      result[serviceName].push({ modelId: model.modelId, cost: parseFloat(cost.toFixed(10)) })
    }
  }
  return result
}

// Roughly calculates cost for all LLM services/models using the total tokens approach
async function computeAllLLMCosts(filePath: string) {
  const content = await readFile(filePath, 'utf8')
  const tokenCount = Math.max(1, content.trim().split(/\s+/).length)
  const estimatedOutputTokens = 4000
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  for (const [serviceName, config] of Object.entries(L_CONFIG)) {
    // skip if no models
    if (!config.models || config.models.length === 0) {
      continue
    }
    result[serviceName] = []
    for (const model of config.models) {
      const inputCostRate = (model.inputCostC || 0) / 100
      const outputCostRate = (model.outputCostC || 0) / 100
      const inputCost = (tokenCount / 1_000_000) * inputCostRate
      const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
      const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
      result[serviceName].push({ modelId: model.modelId, cost: totalCost })
    }
  }
  return result
}

export async function handleCostRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const requestData = request.body as Record<string, any> || {}
    const type = requestData['type']
    if (!['transcriptCost', 'llmCost'].includes(type)) {
      reply.status(400).send({ error: 'Valid cost type is required (transcriptCost or llmCost)' })
      return
    }
    l('\nEntered handleCostRequest for cost calculations')
    const filePath = requestData['filePath']
    if (!filePath) {
      reply.status(400).send({ error: 'File path (or URL for audio) is required' })
      return
    }
    if (type === 'transcriptCost') {
      const costResults = await computeAllTranscriptCosts(filePath)
      reply.send({ transcriptCost: costResults })
    } else {
      const costResults = await computeAllLLMCosts(filePath)
      reply.send({ llmCost: costResults })
    }
  } catch (error) {
    err('Error processing cost request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the cost request' })
  }
}