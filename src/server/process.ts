// src/server/process.ts

import { processVideo } from '../process-commands/video.ts'
import { processFile } from '../process-commands/file.ts'
import { estimateTranscriptCost } from '../process-steps/03-run-transcription.ts'
import { estimateLLMCost, runLLM } from '../process-steps/05-run-llm.ts'
import { l, err } from '../utils/logging.ts'
import { env, join, writeFile } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

env['SERVER_MODE'] = 'true'

export const handleProcessRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  l('\nEntered handleProcessRequest')
  try {
    const requestData = request.body as Record<string, any> || {}
    l('\nParsed request body:', requestData)
    const type = requestData['type']
    const walletAddress = requestData['walletAddress']
    const mnemonic = requestData['mnemonic']
    l(`walletAddress from request: ${walletAddress}, mnemonic from request: ${mnemonic}`)

    if (!['video', 'file', 'transcriptCost', 'llmCost', 'runLLM'].includes(type)) {
      l('Invalid or missing process type, sending 400')
      reply.status(400).send({ error: 'Valid process type is required' })
      return
    }

    const options: ProcessingOptions = {}
    const otherOptions = [
      'speakerLabels',
      'prompt',
      'saveAudio',
      'info',
      'walletAddress',
      'mnemonic'
    ]
    for (const opt of otherOptions) {
      if (requestData[opt] != null) {
        options[opt] = requestData[opt]
      }
    }

    const llmServices = requestData['llm']
    if (llmServices) {
      options[llmServices] = requestData['llmModel'] || true
    }

    const transcriptServicesRaw = requestData['transcriptServices'] || 'whisper'
    const transcriptServices = transcriptServicesRaw as 'whisper' | 'deepgram' | 'assembly'
    const modelField = requestData['transcriptModel'] || requestData[`${transcriptServices}Model`]
    const defaultModelId = TRANSCRIPTION_SERVICES_CONFIG[transcriptServices].models[0].modelId
    options[transcriptServices] = modelField || defaultModelId
    options['walletAddress'] = walletAddress
    options['mnemonic'] = mnemonic

    switch (type) {
      case 'video': {
        const url = requestData['url']
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
        reply.send({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript
        })
        break
      }
      case 'file': {
        const filePath = requestData['filePath']
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
        const filePath = requestData['filePath']
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
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
        const filePath = requestData['filePath']
        if (!filePath) {
          reply.status(400).send({ error: 'File path is required' })
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
        const frontMatter = requestData['frontMatter'] || ''
        const prompt = requestData['prompt'] || ''
        const transcript = requestData['transcript'] || ''
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