// src/pages/api/dash-balance.ts

import type { APIRoute, APIContext } from "astro"
import Dash from "dash"
import { Buffer } from 'node:buffer'

export const POST: APIRoute = async ({ request }: APIContext) => {
  console.log("[api/dash-balance] POST request handler started (Fastify Mimic).")
  let client = null
  try {
    console.log("[api/dash-balance] Parsing request body...")
    const body = await request.json()
    const { mnemonic, walletAddress } = body as { mnemonic?: string, walletAddress?: string }

    if (!mnemonic || !walletAddress) {
      console.error("[api/dash-balance] Error: Missing required parameters 'mnemonic' or 'walletAddress'.")
      const errorPayload = JSON.stringify({ error: 'mnemonic and walletAddress are required' })
      return new Response(Buffer.from(errorPayload), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Solution': 'Fastify-Mimic' }
      })
    }

    console.log(`[api/dash-balance] Attempting to connect to Dash client for wallet: ${walletAddress}`)
    client = new Dash.Client({
      network: 'testnet',
      wallet: {
        mnemonic,
        unsafeOptions: { skipSynchronizationBeforeHeight: 1000000 }
      }
    })

    console.log("[api/dash-balance] Getting wallet account...")
    const account = await client.getWalletAccount()
    console.log("[api/dash-balance] Retrieving total balance...")
    const totalBalance = account.getTotalBalance()
    console.log(`[api/dash-balance] Balance retrieved: ${totalBalance}. Preparing success response.`)

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
    console.error(`[api/dash-balance] Error during processing: ${error instanceof Error ? error.stack : String(error)}`)
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
      console.log("[api/dash-balance] Entering finally block. Disconnecting client...")
      client.disconnect().catch(disconnectError => {
        console.error(`[api/dash-balance] Non-blocking disconnect error: ${disconnectError instanceof Error ? disconnectError.stack : String(disconnectError)}`)
      })
      console.log("[api/dash-balance] Disconnect initiated (non-blocking).")
    }
    console.log("[api/dash-balance] Exiting finally block. POST request handler finished.")
  }
}