// src/fastify.ts

import Dash from 'dash'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { l } from './utils.ts'
import { env } from './utils.ts'
import { ENV_VARS_MAP } from '../shared/constants.ts'
import { dbService } from './db.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const getShowNotes = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const showNotes = await dbService.getShowNotes()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}

export const getShowNote = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const showNote = await dbService.getShowNote(Number(id))
    if (showNote) {
      reply.send({ showNote })
    } else {
      reply.status(404).send({ error: 'Show note not found' })
    }
  } catch (error) {
    console.error('Error fetching show note:', error)
    reply.status(500).send({ error: 'An error occurred while fetching the show note' })
  }
}

export async function handleDashBalance(request: FastifyRequest, reply: FastifyReply) {
  const { mnemonic, walletAddress } = request.body as { mnemonic?: string, walletAddress?: string }
  if (!mnemonic || !walletAddress) {
    reply.status(400).send({ error: 'mnemonic and walletAddress are required' })
    return
  }
  const client = new Dash.Client({ network: 'testnet', wallet: { mnemonic, unsafeOptions: { skipSynchronizationBeforeHeight: 1000000 } } })
  try {
    const account = await client.getWalletAccount()
    const totalBalance = account.getTotalBalance()
    reply.send({ address: walletAddress, balance: totalBalance })
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  } finally {
    client.disconnect()
  }
}

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
  fastify.post('/dash-balance',handleDashBalance)

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