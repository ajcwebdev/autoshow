// src/server/cost.ts

import { l, err } from '../logging.ts'
import { execPromise, readFile } from '../utils.ts'
import { T_CONFIG, L_CONFIG } from '../../shared/constants.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'

async function getAudioDurationInSeconds(filePath: string) {
  l.dim(`getAudioDurationInSeconds called with filePath: ${filePath}`)
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  l.dim(`Executing command: ${cmd}`)
  const { stdout } = await execPromise(cmd)
  l.dim(`ffprobe stdout: ${stdout}`)
  const seconds = parseFloat(stdout.trim())
  l.dim(`Parsed duration: ${seconds}`)
  if (isNaN(seconds)) {
    err(`Could not parse audio duration for file: ${filePath}`)
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  return seconds
}

export async function computeAllTranscriptCosts(filePath: string) {
  l.dim(`computeAllTranscriptCosts called with filePath: ${filePath}`)
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  l.dim(`Total minutes: ${minutes}`)
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  for (const [serviceName, config] of Object.entries(T_CONFIG)) {
    l.dim(`Processing service: ${serviceName}`)
    result[serviceName] = []
    for (const model of config.models) {
      const cost = model.costPerMinuteCents * minutes
      const finalCost = parseFloat(cost.toFixed(10))
      l.dim(`Model: ${model.modelId}, cost: ${finalCost}`)
      result[serviceName].push({ modelId: model.modelId, cost: finalCost })
    }
  }
  l.dim(`Final transcriptCost result: ${JSON.stringify(result)}`)
  return result
}

export async function computeAllLLMCosts(filePath: string) {
  l.dim(`computeAllLLMCosts called with filePath: ${filePath}`)
  const content = await readFile(filePath, 'utf8')
  l.dim(`Read file content length: ${content.length}`)
  const tokenCount = Math.max(1, content.trim().split(/\s+/).length)
  l.dim(`Calculated token count: ${tokenCount}`)
  const estimatedOutputTokens = 4000
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  for (const [serviceName, config] of Object.entries(L_CONFIG)) {
    if (!config.models || config.models.length === 0) {
      l.dim(`Skipping service: ${serviceName}, no models found`)
      continue
    }
    l.dim(`Processing service: ${serviceName}`)
    result[serviceName] = []
    for (const model of config.models) {
      const inputCostRate = (model.inputCostC || 0) / 100
      const outputCostRate = (model.outputCostC || 0) / 100
      const inputCost = (tokenCount / 1_000_000) * inputCostRate
      const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
      const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
      l.dim(`Model: ${model.modelId}, inputCostRate: ${inputCostRate}, outputCostRate: ${outputCostRate}, totalCost: ${totalCost}`)
      result[serviceName].push({ modelId: model.modelId, cost: totalCost })
    }
  }
  l.dim(`Final llmCost result: ${JSON.stringify(result)}`)
  return result
}

export async function handleCostRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const requestData = request.body as Record<string, any> || {}
    const type = requestData['type']
    l.dim(`handleCostRequest called, type: ${type}`)
    if (!['transcriptCost', 'llmCost'].includes(type)) {
      l.dim(`Invalid type provided: ${type}`)
      reply.status(400).send({ error: 'Valid cost type is required (transcriptCost or llmCost)' })
      return
    }
    l('\nEntered handleCostRequest for cost calculations')
    const filePath = requestData['filePath']
    l.dim(`filePath: ${filePath}`)
    if (!filePath) {
      l.dim(`No filePath provided`)
      reply.status(400).send({ error: 'File path (or URL for audio) is required' })
      return
    }
    if (type === 'transcriptCost') {
      l.dim('Calling computeAllTranscriptCosts')
      const costResults = await computeAllTranscriptCosts(filePath)
      l.dim(`Returning transcriptCost: ${JSON.stringify(costResults)}`)
      reply.send({ transcriptCost: costResults })
    } else {
      l.dim('Calling computeAllLLMCosts')
      const costResults = await computeAllLLMCosts(filePath)
      l.dim(`Returning llmCost: ${JSON.stringify(costResults)}`)
      reply.send({ llmCost: costResults })
    }
  } catch (error) {
    err('Error processing cost request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the cost request' })
  }
}
