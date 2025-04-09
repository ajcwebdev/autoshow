// src/server/process.ts

import { generateMarkdown } from '../process-steps/01-generate-markdown.ts'
import { downloadAudio, saveAudio } from '../process-steps/02-download-audio.ts'
import { runTranscription } from '../process-steps/03-run-transcription.ts'
import { selectPrompts } from '../process-steps/04-select-prompt.ts'
import { runLLM } from '../process-steps/05-run-llm.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { env, join, writeFile } from '../utils/node-utils.ts'
import { T_CONFIG } from '../../shared/constants.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

env['SERVER_MODE'] = 'true'

export async function processFile(
  options: ProcessingOptions,
  filePath: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processFile', { filePath, llmServices, transcriptServices })

  try {
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, filePath)
    await downloadAudio(options, filePath, filename)
    const { transcript, transcriptionCost, modelId: transcriptionModel } = await runTranscription(options, finalPath, transcriptServices)
    const selectedPrompts = await selectPrompts(options)
    const { showNote, showNotesResult } = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata as ShowNoteMetadata,
      llmServices,
      transcriptServices,
      transcriptionModel,
      transcriptionCost
    )

    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    l.dim('\n  processFile command completed successfully.')

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: showNotesResult || '',
      transcript,
      ...showNote
    }
  } catch (error) {
    err(`Error processing file: ${(error as Error).message}`)
    process.exit(1)
  }
}

export async function processVideo(
  options: ProcessingOptions,
  url: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processVideo', { url, llmServices, transcriptServices })

  try {
    const { frontMatter, finalPath, filename, metadata } = await generateMarkdown(options, url)
    await downloadAudio(options, url, filename)
    const { transcript, transcriptionCost, modelId: transcriptionModel } = await runTranscription(options, finalPath, transcriptServices)
    const selectedPrompts = await selectPrompts(options)
    const { showNote, showNotesResult } = await runLLM(
      options,
      finalPath,
      frontMatter,
      selectedPrompts,
      transcript,
      metadata as ShowNoteMetadata,
      llmServices,
      transcriptServices,
      transcriptionModel,
      transcriptionCost
    )

    if (!options.saveAudio) {
      await saveAudio(finalPath)
    }

    return {
      frontMatter,
      prompt: selectedPrompts,
      llmOutput: showNotesResult || '',
      transcript,
      ...showNote
    }
  } catch (error) {
    err('Error processing video:', (error as Error).message)
    throw error
  }
}

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
    if (!['video', 'file'].includes(type)) {
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
    const defaultModelId = T_CONFIG[transcriptServices]?.models?.[0]?.modelId || 'base'
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
        reply.send(result)
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
        reply.send(result)
        break
      }
    }
    l('\nProcess completed successfully')
  } catch (error) {
    err('Error processing request:', error)
    reply.status(500).send({ error: 'An error occurred while processing the request' })
  }
}