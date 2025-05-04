// src/pages/api/dash-balance.ts

import type { APIRoute, APIContext } from "astro"
import Dash from "dash"
import { l, err, Buffer } from '../../utils'

export const POST: APIRoute = async ({ request }: APIContext) => {
  const pre = "[api/dash-balance]"
  l(`${pre} POST request handler started (Fastify Mimic).`)
  let client = null
  try {
    l(`${pre} Parsing request body...`)
    const body = await request.json()
    const { mnemonic, walletAddress } = body as { mnemonic?: string, walletAddress?: string }

    if (!mnemonic || !walletAddress) {
      err(`${pre} Error: Missing required parameters 'mnemonic' or 'walletAddress'.`)
      const errorPayload = JSON.stringify({ error: 'mnemonic and walletAddress are required' })
      return new Response(Buffer.from(errorPayload), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Solution': 'Fastify-Mimic' }
      })
    }

    l(`${pre} Attempting to connect to Dash client for wallet: ${walletAddress}`)
    client = new Dash.Client({
      network: 'testnet',
      wallet: {
        mnemonic,
        unsafeOptions: { skipSynchronizationBeforeHeight: 1000000 }
      }
    })

    l(`${pre} Getting wallet account...`)
    const account = await client.getWalletAccount()
    l(`${pre} Retrieving total balance...`)
    const totalBalance = account.getTotalBalance()
    l(`${pre} Balance retrieved: ${totalBalance}. Preparing success response.`)

    const successPayload = JSON.stringify({ address: walletAddress, balance: totalBalance })
    const successBuffer = Buffer.from(successPayload)
    return new Response(successBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': successBuffer.length.toString(),
        'X-Solution': 'Fastify-Mimic'
      }
    })

  } catch (error) {
    err(`${pre} Error during processing: ${error instanceof Error ? error.stack : String(error)}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorPayload = JSON.stringify({ error: `Failed to retrieve balance: ${errorMessage}` })
    const errorBuffer = Buffer.from(errorPayload)
    return new Response(errorBuffer, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': errorBuffer.length.toString(),
        'X-Solution': 'Fastify-Mimic'
      }
    })
  } finally {
    if (client) {
      l(`${pre} Entering finally block. Disconnecting client...`)
      client.disconnect().catch(disconnectError => {
        err(`${pre} Non-blocking disconnect error: ${disconnectError instanceof Error ? disconnectError.stack : String(disconnectError)}`)
      })
      l(`${pre} Disconnect initiated (non-blocking).`)
    }
    l(`${pre} Exiting finally block. POST request handler finished.`)
  }
}