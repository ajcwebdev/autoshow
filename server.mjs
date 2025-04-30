// server.mjs

import Dash from "dash"
import Fastify from 'fastify'
import fastifyMiddie from '@fastify/middie'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { handler as astroHandler } from './dist/server/entry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = Fastify({ logger: true })

await app.register(fastifyMiddie)

const clientRoot = join(__dirname, './dist/client')
app.register(fastifyStatic, {
  root: clientRoot,
  prefix: '/',
})

// Register the custom Fastify route handler with a path that won't conflict with Astro
app.post('/api/_fastify/dash-balance', async (request, reply) => {
  app.log.info('[Fastify Route] Handling /api/_fastify/dash-balance directly.')
  let client = null
  try {
    const { mnemonic, walletAddress } = request.body
    if (!mnemonic || !walletAddress) {
      app.log.error('[Fastify Route] Missing mnemonic or walletAddress.')
      reply.status(400).send({ error: 'mnemonic and walletAddress are required' })
      return
    }
    app.log.info(`[Fastify Route] Connecting Dash client for ${walletAddress}`)
    client = new Dash.Client({ network: 'testnet', wallet: { mnemonic, unsafeOptions: { skipSynchronizationBeforeHeight: 1000000 } } })
    app.log.info('[Fastify Route] Getting account...')
    const account = await client.getWalletAccount()
    app.log.info('[Fastify Route] Getting balance...')
    const totalBalance = account.getTotalBalance()
    app.log.info(`[Fastify Route] Balance retrieved: ${totalBalance}. Sending response.`)
    reply.status(200).send({ address: walletAddress, balance: totalBalance })
  } catch (error) {
    app.log.error(`[Fastify Route] Error: ${error instanceof Error ? error.message : String(error)}`)
    reply.status(500).send({ error: error instanceof Error ? `Fastify handled error: ${error.message}` : 'Fastify handled unknown error' })
  } finally {
    if (client) {
      app.log.info('[Fastify Route] Disconnecting Dash client in finally block.')
      client.disconnect().catch(e => app.log.error(`[Fastify Route] Disconnect error: ${e.message}`))
    }
  }
})

// Register the Astro handler for all other routes
app.use(astroHandler)

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4321
    await app.listen({ port: port, host: '0.0.0.0' })
    app.log.info(`Fastify server listening on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()