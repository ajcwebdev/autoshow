// src/server/dash-balance.ts

import Dash from 'dash'
import type { FastifyRequest, FastifyReply } from 'fastify'

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