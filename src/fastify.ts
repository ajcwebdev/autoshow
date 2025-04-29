// src/fastify.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { l } from './logging.ts'
import { env } from './utils.ts'
import { ENV_VARS_MAP } from '../shared/constants.ts'
import { getShowNote } from './server/show-note.ts'
import { getShowNotes } from './server/show-notes.ts'
import { handleCostRequest } from './server/cost.ts'
// import { handleDashBalance } from './server/01-dash-balance.ts'
import { handleDownloadAudio, handleGetAudioUrl } from './server/02-download-audio.ts'
import { handleRunTranscription } from './server/03-run-transcription.ts'
import { handleSelectPrompt } from './server/04-select-prompt.ts'
import { handleRunLLM } from './server/05-run-llm.ts'
import { handleSaveMarkdown } from './server/save-markdown.ts'

export function buildFastify() {
  const fastify = Fastify({ logger: true })
  fastify.register(cors,{origin:'*',methods:['GET','POST','OPTIONS'],allowedHeaders:['Content-Type']})

  fastify.addHook('onRequest',async(request)=>{
    l(`[${new Date().toISOString()}] Received ${request.method} request for ${request.url}`)
  })

  fastify.addHook('preHandler',async(request)=>{
    const body = request.body as Record<string,any>
    if(body){
      Object.entries(ENV_VARS_MAP).forEach(([bodyKey,envKey])=>{
        const value=(body as Record<string,string|undefined>)[bodyKey]||(body['options'] as Record<string,string|undefined>)?.[bodyKey]
        if(value) process.env[envKey]=value
      })
    }
  })

  fastify.get('/show-notes',getShowNotes)
  fastify.get('/show-notes/:id',getShowNote)
  // fastify.post('/dash-balance',handleDashBalance)
  fastify.post('/cost',handleCostRequest)
  fastify.post('/download-audio',handleDownloadAudio)
  fastify.post('/get-audio-url',handleGetAudioUrl)
  fastify.post('/run-transcription',handleRunTranscription)
  fastify.post('/select-prompt',handleSelectPrompt)
  fastify.post('/run-llm',handleRunLLM)
  fastify.post('/save-markdown',handleSaveMarkdown)

  return fastify
}

export async function start() {
  const fastify = buildFastify()
  const port = Number(env['PORT'])||3000
  try {
    await fastify.listen({port,host:'0.0.0.0'})
    l(`Server running at http://localhost:${port}`)
  } catch(error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

if(import.meta.url===`file://${process.argv[1]}`){start()}